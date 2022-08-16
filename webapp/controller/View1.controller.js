sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("titan.deal.titandealerstarget.controller.View1", {
            onInit: function () {
                // Model used to manipulate control states
                var oViewModel = new JSONModel({
                    worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                    saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
                    shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
                    worklistHTitle: this.getResourceBundle().getText("worklistTitle"),
                    shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                    shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                    tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                    tableBusyDelay: 0,
                    enableDialogSave: false,
                    selectedBusinessPartner: "",
                    selectedBusinessPartnerName: ""
                });
                this.getView().setModel(oViewModel, "worklistView");
            },

            handleExcelUpload: function (e) {
                this.byId("table1").setBusy(true);
                this._import(e.getParameter("files") && e.getParameter("files")[0]);
            },
    
            _import: function (file) {
                var count = 0;

                if (file && window.FileReader) {
    
                    var reader = new FileReader();
    
                    var result = {},
                        data;
                    var that = this;
                    reader.onload = function (e) {
    
                        data = e.target.result;
    
                        var wb = XLSX.read(data, {
                            type: "binary"
                        });
                        var aReadData = [];
                        wb.SheetNames.forEach(function (sheetName) {
                            var roa = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName], {
                                defval: "",
                                header: ["RSCODE", "RsName", "BeatCode", "DealerCode", "DealerName", "BrandCode", "BrandName", "ParentCode", "SPMON", "Target", "Volume", "Value", "CURR"]
                            });
                            //var aRoa = JSON.parse(JSON.stringify(roa));
                            var aRoa = roa;
                            if (aRoa.length > 0) {
                                for(var i=1; i<aRoa.length;i++){
                                //  aRoa.forEach(function (item, index) {
                                    // if (index < 1) {
                                    //     return;
                                    // }
                                    var item = aRoa[i];
                                    if(!Object.values(item)[3] && !Object.values(item)[1]){
                                        break;
                                    }
                                    count = count + 1;
                                    var oEntry = {
                                        RSCODE: Object.values(item)[0].trim(),
                                        RsName: Object.values(item)[1].trim(),
                                        DealerCode: Object.values(item)[3],
                                        DealerName: Object.values(item)[4].trim(),
                                        BrandCode: Object.values(item)[5].trim(),
                                        BrandName: Object.values(item)[6].trim(),
                                        SPMON: Object.values(item)[8],
                                        Value: Object.values(item)[11],
                                        CURR: Object.values(item)[12]
                                    };
                                    aReadData.push(oEntry);
                                }
                                // }.bind(this));
                            }
                            //roa = aReadData;
                            //roa = JSON.parse(JSON.stringify(roa).replace(/(\\)?"\s*|\s+"/g, ($0, $1) => $1 ? $0 : '"'));
                            if (aReadData.length > 0) {
                                result["SheetData"] = aReadData;
                                var obModel = new JSONModel();
                                obModel.setSizeLimit(1000000);
                                obModel.setData(result);
                                if (result["SheetData"][1].RSCODE !== undefined && result["SheetData"][1].DealerCode !== undefined) {
                                    that.byId("table1").setVisible(true);
                                    that.byId("table1").setModel(obModel);
                                    that.byId("table1").setBusy(false);
                                } else {
                                    that.byId("table1").setBusy(false);
                                    that.byId("table1").setVisible(false);
                                    MessageToast.show("Wrong format of spreadsheet");
                                }
                            }
                        }.bind(this));
    
                        return result;
    
                    }.bind(this);
    
                    reader.readAsBinaryString(file);
    
                }
    
            },
            onUploadFile: function(){
                if(this.byId("table1").getItems().length > 0){
                    var that = this;
                    this.byId("table1").setBusy(true);
                    var obj = [];
                    var oModel = this.byId("table1").getModel();
                    var aData = oModel.getData().SheetData;
                    var oMonth = aData[0].SPMON;
                    var multipleMonthFlag= false; // Added because backend team says one month at a time should be uploaded
                    aData.forEach(function (oEntry) {
                        if(oEntry.SPMON === oMonth){
                            var x = {
                                werks: oEntry.RSCODE,
                                kunnr: oEntry.DealerCode,
                                brand: oEntry.BrandCode,
                                spmon: oEntry.SPMON,
                                value: oEntry.Value,
                                waers: oEntry.CURR
                                }
                            obj.push(x);
                        } else {
                            multipleMonthFlag = true;
                        }
                    }); 
                    if(multipleMonthFlag) {
                        sap.m.MessageBox.error("Please check the month. Kindly upload file for one month at a time");
                        this.byId("table1").setBusy(false);
                        return;
                    }             
                    var oDataIntoBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
                    var _oODataModel = this.getOwnerComponent().getModel();
                    var oEntry = {
                        "Key": "X",
                        "Value": oDataIntoBase64
                    }

                    _oODataModel.create("/BrandTargetNewSet", oEntry, {
                        success: function(){
                            sap.m.MessageBox.success("Spreadsheet data was successfully uploaded.");
                            that.byId("table1").setBusy(false);
                        }, error: function(){
                            sap.m.MessageBox.error("Spreadsheet data could not be uploaded");
                            that.byId("table1").setBusy(false);
                        }
                     });
                }
            },
            formatMonth: function(oTimestamp){
                var year = Number(oTimestamp.toString().substring(0, 4));
				var month = Number(oTimestamp.toString().substring(4, 6)) - 1; // january = 1 december = 11 
                var oDate = new Date(year, month, 1);
                oDate.setHours(0, 0, 0, 0);
                //var date = new Date(2009, 10, 10);  // 2009-11-10
                var month = oDate.toLocaleString('default', { month: 'long' });
                var yearMonth = month + " " + oDate.getFullYear();
                return yearMonth;
            },
            /**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		}
        });
    });
