var FCQuarter = FCQuarter || { _namespace: true };
FCQuarter.DateValidationMessage = "Overlapping fiscal quarters are not allowed.";
FCQuarter.DateStartEndValidationMessage = "Start Date must precede End Date."
FCQuarter.StartDateField = "msdyn_startdate";
FCQuarter.EndDateField = "msdyn_enddate";
FCQuarter.OverLapMessageId = "OverLapMessageId";
FCQuarter.OnChangeofStartorEndDate = function (executionContext) {
    var formContext = executionContext.getFormContext();

    if (formContext.getAttribute("msdyn_startdate") != null && formContext.getAttribute("msdyn_startdate").getValue() != null) {
        var msdyn_startdate = formContext.getAttribute("msdyn_startdate").getValue();

       
        
        var WebPIformattedStartDate = getformattedDateForAPI(msdyn_startdate);
        var filter = "msdyn_startdate le " + WebPIformattedStartDate + " and msdyn_enddate ge " + WebPIformattedStartDate;
        // && exculde id pcperionid & not = form.context.getcurrent id . ne =
        if (Xrm.Page.ui.getFormType() == 2) {
            var currentId = formContext.data.entity.getId();
            if (currentId != null || currentId != undefined) {
                currentId = currentId.replace("{", "").replace("}", "");
                filter = filter + " and msdyn_fiscalcalendarperiodid" + " ne " + currentId;
            }
        }
        

        FCQuarter.ValidateifDateIsInOtherQuarter(formContext, filter, FCQuarter.DateValidationMessage, "msdyn_startdate");
        FCQuarter.ValidateIfDateIsInSelectedCalendarYear(formContext, msdyn_startdate, FCQuarter.StartDateField);
        //For Calender
        if (formContext.getAttribute("msdyn_enddate") != null && formContext.getAttribute("msdyn_enddate").getValue() != null) {
            var msdyn_enddate = formContext.getAttribute("msdyn_enddate").getValue();

            FCQuarter.ValidateIfDateIsStartGTEndDate(formContext, msdyn_startdate, msdyn_enddate);
        }

    }

    if (formContext.getAttribute("msdyn_enddate") != null && formContext.getAttribute("msdyn_enddate").getValue() != null) {
        var msdyn_enddate = formContext.getAttribute("msdyn_enddate").getValue();
        var WebPIformattedEndDate = getformattedDateForAPI(msdyn_enddate);
        var filter = "msdyn_startdate le " + WebPIformattedEndDate + " and msdyn_enddate ge " + WebPIformattedEndDate;
        if (Xrm.Page.ui.getFormType() == 2) {
            var currentId = formContext.data.entity.getId();
            if (currentId != null || currentId != undefined) {
                currentId = currentId.replace("{", "").replace("}", "");
                filter = filter + " and msdyn_fiscalcalendarperiodid" + " ne " + currentId;
            }
        }
        FCQuarter.ValidateifDateIsInOtherQuarter(formContext, filter, FCQuarter.DateValidationMessage, "msdyn_enddate");
        FCQuarter.ValidateIfDateIsInSelectedCalendarYear(formContext, msdyn_enddate, FCQuarter.EndDateField);
        //For Calender
        if (formContext.getAttribute("msdyn_startdate") != null && formContext.getAttribute("msdyn_startdate").getValue() != null) {
            var msdyn_startdate = formContext.getAttribute("msdyn_startdate").getValue();
            FCQuarter.ValidateIfDateIsStartGTEndDate(formContext, msdyn_startdate, msdyn_enddate);
        }
    }

    if (msdyn_enddate != null && msdyn_startdate != null) {
        formContext.getAttribute("sam_daterange").setValue(formContext.getAttribute("msdyn_startdate") + " - " + formContext.getAttribute("msdyn_enddate"));

    }
}

FCQuarter.ValidateifDateIsInOtherQuarter = function (formContext, filter, message, fieldName) {
    formContext.ui.clearFormNotification(FCQuarter.OverLapMessageId);
    var result = true;
    var req = new XMLHttpRequest();
    req.open("GET", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/msdyn_fiscalcalendarperiods?$filter=" + filter, true);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 200) {
                var results = JSON.parse(this.response);
                if (results.value.length >= 1) {
                    formContext.ui.setFormNotification(message, "WARNING", FCQuarter.OverLapMessageId);
                    formContext.getAttribute(fieldName).setValue(null);
                }
            }
            else {
                Xrm.Utility.alertDialog("Error; Please contact Admin");
            }
        }
    };
    req.send();
}

FCQuarter.ValidateIfDateIsInSelectedCalendarYear = function (formContext, date, fieldName) {
    var fiscalyearId = formContext.getAttribute("msdyn_fiscalcalendaryear").getValue();

    if (fiscalyearId != null || fiscalyearId != undefined) {
        fiscalyearId = fiscalyearId[0].id.replace("{", "").replace("}", "");
        var req = new XMLHttpRequest();
        req.open("GET", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/msdyn_fiscalcalendaryears(" + fiscalyearId + ")?$select=msdyn_enddate,msdyn_startdate", true);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {
                    var result = JSON.parse(this.response);
                    var msdyn_enddate = result["msdyn_enddate"];
                    var msdyn_startdate = result["msdyn_startdate"];                  

                    selectedByUserDate = new Date(date);
                    msdyn_startdate = new Date(msdyn_startdate);
                    msdyn_enddate = new Date(msdyn_enddate);
                    if (fieldName == FCQuarter.StartDateField && selectedByUserDate < msdyn_startdate) {
                        //
                        formContext.getAttribute(fieldName).setValue(null);
                    }
                    else if (fieldName == FCQuarter.EndDateField && selectedByUserDate > msdyn_enddate) {

                        //
                        formContext.getAttribute(fieldName).setValue(null);
                    }

                } else {
                    Xrm.Utility.alertDialog("Error: rValidateIfDateIsInSelectedCalendarYear");
                }
            }
        };
        req.send();
    }

}

function getformattedDate(date) {


    var year = date.getFullYear() + "";

    var month = (date.getMonth() + 1) + "";

    var day = date.getDate() + "";

    return month + "/" + day + "/" + year;
}
function getformattedDateForAPI(date) {


    var year = date.getFullYear() + "";

    var month = (date.getMonth() + 1) + "";

    var day = date.getDate() + "";

    return year + "-" + month + "-" + day;
}

//This is for Calender
FCQuarter.ValidateIfDateIsStartGTEndDate = function (formContext, startdate, enddate) {
    if (startdate != null && enddate != null) {
        if (enddate < startdate) {
            formContext.getAttribute(FCQuarter.StartDateField).setValue(null);
            formContext.getAttribute(FCQuarter.EndDateField).setValue(null);
            formContext.ui.setFormNotification(FCQuarter.DateStartEndValidationMessage, "WARNING", FCQuarter.OverLapMessageId);
        }
    }

}