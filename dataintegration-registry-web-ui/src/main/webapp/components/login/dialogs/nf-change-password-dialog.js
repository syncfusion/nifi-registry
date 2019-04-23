/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var ngRouter = require('@angular/router');
var rxjs = require('rxjs/Observable');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
var ngCore = require('@angular/core');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var ngRouter = require('@angular/router');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngMaterial = require('@angular/material');

function NfRegistryChangePassword(nfRegistryApi, fdsSnackBarService, nfRegistryService, activatedRoute, router, matDialogRef) {
    // Services
    this.snackBarService = fdsSnackBarService;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dialogRef = matDialogRef;
    this.route = activatedRoute;
    this.router = router;
    this._bucketname = '';
    // local state
    this.keepDialogOpen = false;
}
;

NfRegistryChangePassword.prototype = {
    constructor: NfRegistryChangePassword,

    /**
     * Initialize the component.
     */
    ngOnInit: function () {

    },

    /**
     * Cancel creation of a new bucket and close dialog.
     */
    cancel: function () {
        this.dialogRef.close();
    },

    updateNewPassword: function () {
        var newPassword = $("#changepassword-username").val().trim();
        var confirmPassword = $("#changepassword-password").val().trim();
        if ($('#changepassword-username').val().trim() === "" || $('#changepassword-password').val().trim() === "") {
            $('#change-password input[type=password]').css("border", "1px solid red");
            $("#password-match-validation").css("display", "none");
            $("#password-fields-error-validation").css("display", "block");
        } else {
            if (newPassword === confirmPassword) {
                var currentUser = this.nfRegistryService.currentUser.identity;
                this.changeNewPassword(currentUser, newPassword);
            } else {
                $('#change-password input[type=password]').css("border", "1px solid red");
                $("#password-fields-error-validation").css("display", "none");
                $("#password-match-validation").css("display", "block");
            }
        }
    },

    changeNewPassword: function (currentUserIdentity, confirmPasswordInput) {
        var self = this;
        var type = "changePassword";
        this.nfRegistryApi.ValidateCredentials(currentUserIdentity, confirmPasswordInput, type).subscribe(function (response) {
            if (response === "Success") {
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Success',
                    message: 'New password updated successfully.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'success-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
                self.dialogRef.close();
                delete self.nfRegistryService.currentUser.identity;
                delete self.nfRegistryService.currentUser.anonymous;
                localStorage.removeItem(window.location.hostname + "-status");
                $("#nifi-registry-toolbar").css("display", "none");
                $("#nf-registry-app-container").css("background-color", "#F9F9F9");
                self.nfRegistryService.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');
            } else {
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Error',
                    message: 'Failed to update new password.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'failure-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
            }
        });

    }
};

NfRegistryChangePassword.annotations = [
    new ngCore.Component({
        template: require('./nf-change-password-dialog.html!text')
    })
];

NfRegistryChangePassword.parameters = [
    NfRegistryApi,
    fdsSnackBarsModule.FdsSnackBarService,
    NfRegistryService,
    ngRouter.ActivatedRoute,
    ngRouter.Router,
    ngMaterial.MatDialogRef
];

module.exports = NfRegistryChangePassword;