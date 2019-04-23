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
var NfRegistryUser = require('nifi-registry/components/explorer/user/nf-registry-user.js');
var NfRegistryCreateNewGroup = require('nifi-registry/components/administration/users/dialogs/create-new-group/nf-registry-create-new-group.js');
/**
 * NfRegistryManageUser constructor.
 *
 * @param nfRegistryApi         The api service.
 * @param nfRegistryService     The nf-registry.service module.
 * @param tdDataTableService    The covalent data table service module.
 * @param fdsDialogService      The FDS dialog service.
 * @param fdsSnackBarService    The FDS snack bar service module.
 * @param activatedRoute        The angular route module.
 * @param router                The angular router module.
 * @param matDialog             The angular material dialog module.
 * @param nfRegistryUser        The nf-registry user module.
 * @constructor
 */
function NfRegistryManageUser(nfRegistryApi,nfRegistryService,tdDataTableService, fdsSnackBarService, router, matDialog) {
  //Services
    this.dataTableService = tdDataTableService;
    this.snackBarService = fdsSnackBarService;
    this.nfRegistryService = nfRegistryService;
    this.nfRegistryApi = nfRegistryApi;
    this.dialog = matDialog;
    this.router=router;
    // local state
    //make an independent copy of the groups for sorting and selecting within the scope of this component
    this.groups = $.extend(true, [], this.nfRegistryService.groups);
    this.filteredUserGroups = [];
    this.isAddToSelectedGroupsDisabled = true;
    this.userGroupsSearchTerms = [];
    this.userGroupsSearchTerm = '';
    this.allGroupsSelected = false;
    this.isFiltered = false;
    this.user = this.nfRegistryService.user;
};

NfRegistryManageUser.prototype = {
    constructor: NfRegistryManageUser,

    /**
     * Initialize the component.
     */
    ngOnInit: function () {
        var self = this;

        // filter out any groups that
        // 1) that are not configurable
        self.groups = self.groups.filter(function (group) {
            return (group.configurable) ? true : false
        });
        // 2) the user already belongs to
        this.user.userGroups.forEach(function (userGroup) {
            self.groups = self.groups.filter(function (group) {
                return (group.identifier !== userGroup.identifier) ? true : false
            });
        });

        this.filterGroups();
        this.deselectAllUserGroups();
        this.determineAllUserGroupsSelectedState();
    },

    /**
     * Filter groups.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterGroups: function (sortBy, sortOrder) {
        var newUserGroupsData = this.groups;
        newUserGroupsData = this.dataTableService.filterData(newUserGroupsData, this.userGroupsSearchTerm, true);
        this.filteredUserGroups = newUserGroupsData;
    },

    /**
    * Search Usergroups.
    *
    * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
    * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
    */
    searchGroups: function () {
//        if($("#searchGroups").val() === ""){
//           $("#manage-user-close-icon").click();
//        }
        this.userGroupsSearchTerm = $(".user-search-textbox").val();
        var newUserGroupsData = this.groups;
        newUserGroupsData = this.dataTableService.filterData(newUserGroupsData, this.userGroupsSearchTerm, true);
        this.filteredUserGroups = newUserGroupsData;
    },
    /**
     * Sort `filteredUserGroups` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortUserGroups: function (column) {
        if (column.sortable) {
            var sortBy = column.name;
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
            this.filterGroups(sortBy, sortOrder);
        }
    },

    /**
     * Checks the `allGroupsSelected` property state and either selects
     * or deselects each of the `filteredUserGroups`.
     */
    toggleUserGroupsSelectAll: function () {
        if (this.allGroupsSelected) {
            this.selectAllUserGroups();
        } else {
            this.deselectAllUserGroups();
        }
    },

    /**
     * Sets the `checked` property of each of the `filteredUserGroups` to true
     * and sets the `isAddToSelectedGroupsDisabled` and the `allGroupsSelected`
     * properties accordingly.
     */
    selectAllUserGroups: function () {
        this.filteredUserGroups.forEach(function (c) {
            c.checked = true;
        });
        this.isAddToSelectedGroupsDisabled = false;
        this.allGroupsSelected = true;
    },

    /**
     * Sets the `checked` property of each group to false
     * and sets the `isAddToSelectedGroupsDisabled` and the `allGroupsSelected`
     * properties accordingly.
     */
    deselectAllUserGroups: function () {
        this.filteredUserGroups.forEach(function (c) {
            c.checked = false;
        });
        this.isAddToSelectedGroupsDisabled = true;
        this.allGroupsSelected = false;
    },

    /**
     * Checks of each of the `filteredUserGroups`'s checked property state
     * and sets the `allBucketsSelected` and `isAddToSelectedGroupsDisabled`
     * property accordingly.
     */
    determineAllUserGroupsSelectedState: function () {
        var selected = 0;
        var allSelected = true;
        this.filteredUserGroups.forEach(function (c) {
            if (c.checked) {
                selected++;
            }
            if (c.checked === undefined || c.checked === false) {
                allSelected = false;
            }
        });

        if (selected > 0) {
            this.isAddToSelectedGroupsDisabled = false;
        } else {
            this.isAddToSelectedGroupsDisabled = true;
        }

        this.allGroupsSelected = allSelected;
    },
     /**
     * Remove filtered text
     */
      searchCloseBtn: function() {
         this.filteredUserGroups = this.groups;
         $(".user-search-textbox").val('');
    },
    /**
     * Adds users to each of the selected groups.
     */
    addToSelectedGroups: function () {
        var self = this;
        var selectedGroups = this.filteredUserGroups.filter(function (filteredUserGroup) {
            return filteredUserGroup.checked;
        });
        selectedGroups.forEach(function (selectedGroup) {
            selectedGroup.users.push(self.user);
            self.nfRegistryApi.updateUserGroup(selectedGroup.identifier, selectedGroup.identity, selectedGroup.users).subscribe(function (group) {
                   self.user.userGroups.push(group);
                   self.closeSideNav();
                var snackBarRef = self.snackBarService.openCoaster({
                    title: 'Success',
                    message: 'User has been added to the ' + group.identity + ' group.',
                    verticalPosition: 'bottom',
                    horizontalPosition: 'right',
                    icon: 'success-toaster-icon',
                    color: '#1EB475',
                    duration: 3000
                });
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
    },
      /**
     * Opens the create new group dialog.
     */
    createNewGroup: function () {
        var self = this;
        self.dialog.open(NfRegistryCreateNewGroup, {
            disableClose: true,
             width: '400px'
        }).afterClosed().subscribe(function (dialogResult) {
            self.groups.push(dialogResult.group);
                    self.filterGroups();
                });
        }
};

NfRegistryManageUser.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-manage-user.html!text')
    })
];

NfRegistryManageUser.parameters = [
    NfRegistryApi,
    NfRegistryService,
    covalentCore.TdDataTableService,
    fdsSnackBarsModule.FdsSnackBarService,
    ngRouter.Router,
    ngMaterial.MatDialog,

];

module.exports = NfRegistryManageUser;
