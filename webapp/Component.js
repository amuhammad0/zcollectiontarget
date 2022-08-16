sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "titan/deal/titandealerstarget/model/models",
        "./libs/jszip",
        "./libs/xlsx"
    ],
    function (UIComponent, Device, models, jszip, XLSX) {
        "use strict";

        return UIComponent.extend("titan.deal.titandealerstarget.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);