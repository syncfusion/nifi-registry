/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var covalentCore = require('@covalent/core');
var fdsDialogsModule = require('@fluid-design-system/dialogs');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
var ngCore = require('@angular/core');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var ngRouter = require('@angular/router');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var ngMaterial = require('@angular/material');
var NfRegistryAddUser = require('nifi-registry/components/administration/users/dialogs/add-user/nf-registry-add-user.js');

/**
 * NfRegistryManageGroup constructor.
 *
 * @param nfRegistryApi         The api service.
 * @param nfRegistryService     The nf-registry.service module.
 * @param tdDataTableService    The covalent data table service module.
 * @param fdsDialogService      The FDS dialog service.
 * @param fdsSnackBarService    The FDS snack bar service module.
 * @param activatedRoute        The angular route module.
 * @param router                The angular router module.
 * @param matDialog             The angular material dialog module.
 * @constructor
 */
function NfRegistryManageGroup(nfRegistryApi, nfRegistryService, tdDataTableService,fdsSnackBarService,router,matDialog) {
    this.dataTableService = tdDataTableService;
    this.snackBarService = fdsSnackBarService;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.router = router;
    this.dialog = matDialog;
    // local state
    //make an independent copy of the users for sorting and selecting within the scope of this component
    this.users = $.extend(true, [], this.nfRegistryService.users);
    this.filteredUsers = [];
    this.isAddSelectedUsersToGroupDisabled = true;
    this.usersSearchTerms = [];
    this.usersSearchTerm='';
    this.allUsersSelected = false;
    this.group = this.nfRegistryService.group;
};

NfRegistryManageGroup.prototype = {
    constructor: NfRegistryManageGroup,

     /**
     * Initialize the component.
     */
    ngOnInit: function () {
        var self = this;

        this.group.users.forEach(function (groupUser) {
            self.users = self.users.filter(function (user) {
                return (user.identifier !== groupUser.identifier) ? true : false
            });
        });

        this.filterUsers();
        this.deselectAllUsers();
        this.determineAllUsersSelectedState();
    },
/**
     * Filter users.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    searchUsers: function () {
        this.usersSearchTerm=$(".user-search-textbox").val();
        var newUsersData = this.users;
        newUsersData = this.dataTableService.filterData(newUsersData, this.usersSearchTerm, true);
        this.filteredUsers = newUsersData;
    },
    /**
     * Filter users.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterUsers: function (sortBy, sortOrder) {
        var newUsersData = this.users;
        newUsersData = this.dataTableService.filterData(newUsersData, this.usersSearchTerm, true);
        this.filteredUsers = newUsersData;
    },

    /**
     * Sort `filteredUsers` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortUsers: function (column) {
        if (column.sortable) {
            var sortBy = column.name;
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
            this.filterUsers(sortBy, sortOrder);
        }
    },
    /**
     * Opens the create new bucket dialog.
     */
    addUser: function () {
        var self = this;
        this.dialog.open(NfRegistryAddUser, {
            disableClose: true,
             width: '400px'
        }).afterClosed().subscribe(function (dialogResult) {
            self.users.push(dialogResult.user);
                    self.filterUsers();
                });
    },
    /**
     * Checks the `allUsersSelected` property state and either selects
     * or deselects each of the `filteredUsers`.
     */
    toggleUsersSelectAll: function () {
        if (this.allUsersSelected) {
            this.selectAllUsers();
        } else {
            this.deselectAllUsers();
        }
    },

    /**
     * Sets the `checked` property of each of the `filteredUsers` to true
     * and sets the `isAddSelectedUsersToGroupDisabled` and the `allUsersSelected`
     * properties accordingly.
     */
    selectAllUsers: function () {
        this.filteredUsers.forEach(function (c) {
            c.checked = true;
        });
        this.isAddSelectedUsersToGroupDisabled = false;
        this.allUsersSelected = true;
    },
     /**
     * Remove filtered text
     */
      searchCloseBtn: function() {
         this.filteredUsers =this.users;
         $(".user-search-textbox").val('');
    },

    /**
     * Sets the `checked` property of each group to false
     * and sets the `isAddSelectedUsersToGroupDisabled` and the `allUsersSelected`
     * properties accordingly.
     */
    deselectAllUsers: function () {
        this.filteredUsers.forEach(function (c) {
            c.checked = false;
        });
        this.isAddSelectedUsersToGroupDisabled = true;
        this.allUsersSelected = false;
    },

    /**
     * Checks of each of the `filteredUsers`'s checked property state
     * and sets the `allBucketsSelected` and `isAddSelectedUsersToGroupDisabled`
     * property accordingly.
     */
    determineAllUsersSelectedState: function () {
     var selected = 0;
        var allSelected = true;
        this.filteredUsers.forEach(function (c) {
            if (c.checked) {
                selected++;
            }
            if (c.checked === undefined || c.checked === false) {
                allSelected = false;
            }
        });

        if (selected > 0) {
            this.isAddSelectedUsersToGroupDisabled = false;
        } else {
            this.isAddSelectedUsersToGroupDisabled = true;
        }

        this.allUsersSelected = allSelected;
    },

    /**
     * Adds each of the selected users to this group.
     */
    addSelectedUsersToGroup: function () {
        var self = this;
        this.filteredUsers.filter(function (filteredUser) {
            if(filteredUser.checked) {
               if(self.group.users.indexOf(filteredUser)=== -1){
                self.group.users.push(filteredUser);    
               }
            }
        });
        this.nfRegistryApi.updateUserGroup(self.group.identifier, self.group.identity, self.group.users).subscribe(function (group) {
            self.closeSideNav();
            var snackBarRef = self.snackBarService.openCoaster({
                title: 'Success',
                message: 'Selected users have been added to the ' + self.group.identity + ' group.',
                verticalPosition: 'bottom',
                horizontalPosition: 'right',
                icon: 'success-toaster-icon',
                color: '#1EB475',
                duration: 3000
            });
        });
    },

    /**
     * Cancel adding selected users to groups and close the dialog.
     */
    cancel: function () {
        this.router.navigateByUrl('/dataintegration-registry/explorer/user');
    },
        /**
     * Destroy the component.
     */
    ngOnDestroy: function () {
        this.nfRegistryService.sidenav.close();
    },

    /**
     * Navigate to administer users for current registry.
     */
    closeSideNav: function () {
        this.router.navigateByUrl('/dataintegration-registry/explorer/user');
    }
};

NfRegistryManageGroup.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-manage-group.html!text')
    })
];

NfRegistryManageGroup.parameters = [
    NfRegistryApi,
    NfRegistryService,
    covalentCore.TdDataTableService,
    fdsSnackBarsModule.FdsSnackBarService,
    ngRouter.Router,
    ngMaterial.MatDialog
];

module.exports = NfRegistryManageGroup;
