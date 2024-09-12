var FCYear = FCYear || { _namespace: true };
FCYear.DateValidationMessage = "Overlapping fiscal quarters are not allowed.";
FCYear.DateStartEndValidationMessage = "Start Date must precede End Date."
FCYear.StartDateField = "msdyn_startdate";
FCYear.EndDateField = "msdyn_enddate";
FCYear.OverLapMessageId = "OverLapMessageId";
FCYear.OnChangeofStartorEndDate = function (executionContext) {
    var formContext = executionContext.getFormContext();

    if (formContext.getAttribute("msdyn_startdate") != null && formContext.getAttribute("msdyn_startdate").getValue() != null) {
        var msdyn_startdate = formContext.getAttribute("msdyn_startdate").getValue();
        var WebPIformattedStartDate = getformattedDateForAPI(msdyn_startdate);
        var msdyn_startdate_f = getformattedDate(msdyn_startdate);

        var filter = "msdyn_startdate le " + WebPIformattedStartDate + " and msdyn_enddate ge " + WebPIformattedStartDate;
        //only  add this conditon for edit
        if (Xrm.Page.ui.getFormType() == 2) {
            var currentId = formContext.data.entity.getId();
            if (currentId != null || currentId != undefined) {
                currentId = currentId.replace("{", "").replace("}", "");
                filter = filter + " and msdyn_fiscalcalendaryearid" + " ne " + currentId;
            }
        }

        FCYear.ValidateifDateIsInOtherQuarter(formContext, filter, FCYear.DateValidationMessage, "msdyn_startdate");

        if (formContext.getAttribute("msdyn_enddate") != null && formContext.getAttribute("msdyn_enddate").getValue() != null) {
            var msdyn_enddate = formContext.getAttribute("msdyn_enddate").getValue();

            FCYear.ValidateIfDateIsStartGTEndDate(formContext, msdyn_startdate, msdyn_enddate);
        }

    }

    if (formContext.getAttribute("msdyn_enddate") != null && formContext.getAttribute("msdyn_enddate").getValue() != null) {
        var msdyn_enddate = formContext.getAttribute("msdyn_enddate").getValue();
        var WebPIformattedEndDate = getformattedDateForAPI(msdyn_enddate);
        var msdyn_enddate_f = getformattedDate(msdyn_enddate);
        var filter = "msdyn_startdate le " + WebPIformattedEndDate + " and msdyn_enddate ge " + WebPIformattedEndDate;
        //only  add this conditon for edit
        if (Xrm.Page.ui.getFormType() == 2) {
            var currentId = formContext.data.entity.getId();
            if (currentId != null || currentId != undefined) {
                currentId = currentId.replace("{", "").replace("}", "");
                filter = filter + " and msdyn_fiscalcalendaryearid" + " ne " + currentId;
            }
        }
        FCYear.ValidateifDateIsInOtherQuarter(formContext, filter, FCYear.DateValidationMessage, "msdyn_enddate");
        //FCYear.ValidateIfDateIsInSelectedCalendarYear(formContext, WebPIformattedEndDate, FCYear.EndDateField);
        //For Calender
        if (formContext.getAttribute("msdyn_startdate") != null && formContext.getAttribute("msdyn_startdate").getValue() != null) {
            var msdyn_startdate = formContext.getAttribute("msdyn_startdate").getValue();
            FCYear.ValidateIfDateIsStartGTEndDate(formContext, msdyn_startdate, msdyn_enddate);
        }
    }

    if (msdyn_enddate_f != null && msdyn_startdate_f != null) {
        formContext.getAttribute("sam_daterange").setValue(msdyn_startdate_f + " - " + msdyn_enddate_f);

    }
}

FCYear.ValidateifDateIsInOtherQuarter = function (formContext, filter, message, fieldName) {
    var result = true;
    var req = new XMLHttpRequest();
    req.open("GET", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/msdyn_fiscalcalendaryears?$filter=" + filter, true);
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
                    //xrm notificatiopn =message
                    formContext.ui.setFormNotification(message, "WARNING", FCYear.OverLapMessageId);
                    formContext.getAttribute(fieldName).setValue(null);
                }
            } else {
                Xrm.Utility.alertDialog("ERROR:Resquest not Working");
            }
        }
    };
    req.send();
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
FCYear.ValidateIfDateIsStartGTEndDate = function (formContext, startdate, enddate) {
    if (startdate != null && enddate != null) {
        if (enddate < startdate) {
            formContext.getAttribute(FCYear.StartDateField).setValue(null);
            formContext.getAttribute(FCYear.EndDateField).setValue(null);
            formContext.ui.setFormNotification(FCYear.DateStartEndValidationMessage, "WARNING", FCYear.OverLapMessageId);
        }
    }

}