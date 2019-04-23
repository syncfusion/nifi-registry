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

/* global nfRegistryService */

var covalentCore = require('@covalent/core');
var ngRouter = require('@angular/router');
var ngMaterial = require('@angular/material');
var fdsDialogsModule = require('@fluid-design-system/dialogs');
var fdsSnackBarsModule = require('@fluid-design-system/snackbars');
var NfRegistryApi = require('nifi-registry/services/nf-registry.api.js');
var NfStorage = require('nifi-registry/services/nf-storage.service.js');
var rxjs = require('rxjs/Observable');/**
 * NfRegistryService constructor.
 *
 * @param nfRegistryApi         The api service.
 * @param nfStorage             A wrapper for the browser's local storage.
 * @param tdDataTableService    The covalent data table service module.
 * @param router                The angular router module.
 * @param fdsDialogService      The FDS dialog service.
 * @param fdsSnackBarService    The FDS snack bar service module.
 * @param matDialog      The mat dialog service.
 * @constructor
 */
function NfRegistryService(nfRegistryApi, nfStorage, tdDataTableService, router,matDialog,fdsDialogService, fdsSnackBarService) {
    var self = this;
    this.registry = {
        name: "Syncfusion Data Integration Registry"
    };
    this.documentation = {
        link: 'nifi-registry-docs/documentation'
    };
    this.redirectUrl = '/dataintegration-registry/explorer/grid-list';

    // Services
    this.router = router;
    this.api = nfRegistryApi;
    this.nfStorage = nfStorage;
    this.dialog = matDialog;
    this.dialogService = fdsDialogService;
    this.snackBarService = fdsSnackBarService;
    this.dataTableService = tdDataTableService;    
    this.isPermissionAdded = false;
    this.isbucketFiltered = false;
    this.filteredGroupPermsData=[];
    this.groupPermsData=[];
    this.userPermsData=[];
    this.selectedIdentity="";
    this.userPerms = {};
    this.groupPerms = {};
    this.isFilteredBuckets = false;
    this._bucketname='';
    this._dropletname='';
    this._groupname = '';
    this._username = '';
    this.dropletSelected='';
    this.userPermsSearchTerms = [];
    this.umpEnabledStatus = false;
    this.checkRunningStatus;
    this.isLoggedOut=false;
    this.loggedIn=false;
//    $(document).ready(function () {    
//    checkRunningStatus = setInterval(function(){
//            var isSessionExpired = false;
//            if(!this.isLoggedOut){
//            if (window.location.protocol === "http:" && window.location.pathname.indexOf("explorer")>-1) {
//                var localStorageStatus = localStorage.getItem(window.location.hostname + "-status");
//                if (localStorageStatus !== "true" && this.isLoggedIn ) {
//                    isSessionExpired = true;
//                }
//            } else if (nfStorage.getItem('jwt') === null) {
//                if(checkUMPStatus()){
//                   isSessionExpired = true; 
//                }
//                else{
//                 isSessionExpired = true;     
//                }
//            }
//            if (isSessionExpired) {
//            clearSession();    
//            fdsDialogService.openSessionExpiredDialog({
//                title: 'Delete ',
//                message: 'All versions of this will be deleted.',
//                cancelButton: 'Cancel',
//                acceptButton: 'Delete',
//                acceptButtonColor: 'fds-regular'
//                
//            }).afterClosed().subscribe(
//                function (accept) {
//                });
//            }    
//   }
//   }, 30000);
//    });
//    function checkUMPStatus(){
//    var regitsryAPI = nfRegistryApi;
//        regitsryAPI.checkStatus().subscribe(function (response) {
//            var syncfusionStatus = response.accessStatus;          
//              if(syncfusionStatus.status === 'TRUE')
//              {
//                  return true; 
//              }
//              else{
//                  return false; 
//              }
//        });  
//    }
//    function clearSession(){
//    clearInterval(checkRunningStatus);   
//    }
    // data table column definitions
    this.userColumns = [
        {
            name: 'identity',
            label: 'Display Name',
            sortable: true,
            tooltip: 'User name.',
            width: 100
        }
    ];
    this.userGroupsColumns = [
        {
            name: 'identity',
            label: 'Name',
            sortable: true,
            tooltip: 'User/Group Name.',
            width: 100
        }
    ];
    this.bucketPoliciesColumns = [
        {
            name: 'identity',
            label: 'Name',
            sortable: true,
            tooltip: 'User/Group name.',
            width: 25
        },
        {
            name: 'type',
            label: 'Type',
            sortable: false,
            tooltip: 'User/Group type for this bucket.',
            width: 10
        },
        {
            name: 'permissions',
            label: 'Permissions',
            sortable: false,
            tooltip: 'User/Group permissions for this bucket.',
            width: 75
        },
    ];
    this.dropletColumns = [
        {
            name: 'name',
            label: 'Name',
            sortable: true,
            active: true
        },
        {
            name: 'modifiedTimestamp',
            label: 'Updated',
            sortable: true
        }
    ];
    this.bucketColumns = [
        {
            name: 'name',
            label: 'Bucket Name',
            sortable: true,
            tooltip: 'Sort Buckets by name.'
        }
    ];

    // data table available row action definitions
    this.disableMultiBucketDeleteAction = false;
    this.bucketActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Manage Bucket',
            type: 'sidenav',
            disabled: function(row) {
                return false;
            }
        }, {
            name: 'Delete',
            icon: 'fa fa-trash',
            tooltip: 'Delete Bucket',
            disabled: function(row) {
                return (!row.permissions.canDelete);
            }
        }
    ];
    this.bucketPoliciesActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Manage Policy',
            type: 'dialog'
        }, {
            name: 'Delete',
            icon: 'fa fa-trash',
            tooltip: 'Delete Policy'
        }
    ];
    this.dropletActions = [
        {
            name: 'delete',
            icon: 'fa fa-trash',
            tooltip: 'Delete'
        }
    ];
    this.disableMultiDeleteAction = false;
    this.usersActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Manage User Policies',
            type: 'sidenav',
            tooltip: 'Manage User',
            disabled: function(row) {
                return false;
            }
        }, {
            name: 'delete',
            icon: 'fa fa-trash',
            tooltip: 'Delete User',
            disabled: function(row) {
                return (!self.currentUser.resourcePermissions.tenants.canWrite || !row.configurable);
            }
        }
    ];
    this.userGroupsActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Manage User Group Policies',
            type: 'sidenav',
            disabled: function(row) {
                return false;
            }
        }, {
            name: 'delete',
            icon: 'fa fa-trash',
            tooltip: 'Delete User Group',
            disabled: function(row) {
                return (!self.currentUser.resourcePermissions.tenants.canWrite || !row.configurable);
            }
        }
    ];
    this.addUserToGroupsActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Add User to Group',
            type: 'sidenav',
            disabled: function(row) {
                return false;
            }
        }
    ];
    this.bucketPolicyActions = [
        {
            name: 'manage',
            icon: 'fa fa-pencil',
            tooltip: 'Add Policy to Bucket',
            type: 'sidenav',
            disabled: function(row) {
                return false;
            }
        }
    ];
    // model for buckets privileges
    this.BUCKETS_PRIVS = {
        '/buckets': ['read', 'write', 'delete']
    };

    // model for tenants privileges
    this.TENANTS_PRIVS = {
        '/tenants': ['read', 'write', 'delete']
    };

    // model for policies privileges
    this.POLICIES_PRIVS = {
        '/policies': ['read', 'write', 'delete']
    };

    // model for proxy privileges
    this.PROXY_PRIVS = {
        '/proxy': ['write']
    };

    //<editor-fold desc="application state objects">

   // UMS-Enable-Security
    this.applicationUrl =''; 
    this.umsBaseUrl = '';
    this.usersList =[];
    this.nextbtnThirdPanel = false;
    this.enableApplicationUrl = true;     //first panel 
    this.enableApplicationDetails = false;//second panel
    this.enableApplicationUsers = false;  // third panel
    this.enableLaunchPanel = false; // fourth panel
    //third panel spinner
    this.enablePanelSpinner = false;
    //check error message
    this.showErrorMessage = false;
    this.enableButtonStatus = true;
    this.selectedUserNextBtn = true;
    // General
    this.alerts = [];
    this.inProgress = false;
    this.perspective = '';
    this.breadCrumbState = 'out';
    this.explorerViewType = '';
    this.currentUser = {
        resourcePermissions: {
            anyTopLevelResource: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            buckets: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            tenants: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            policies: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            proxy: {
                canRead: false,
                canWrite: false,
                canDelete: false
            }
        }
    };
    this.bucket = {};
    this.buckets = [];
    this.droplet = {};
    this.droplets = [];
    this.user = {
        resourcePermissions: {
            anyTopLevelResource: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            buckets: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            tenants: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            policies: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            proxy: {
                canRead: false,
                canWrite: false,
                canDelete: false
            }
        }
    };
    this.users = [];
    this.group = {
        resourcePermissions: {
            anyTopLevelResource: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            buckets: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            tenants: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            policies: {
                canRead: false,
                canWrite: false,
                canDelete: false
            },
            proxy: {
                canRead: false,
                canWrite: false,
                canDelete: false
            }
        }
    };
    this.groups = [];

    // Droplets
    this.filteredDroplets = [];
    this.selectedDroplet=[];
    this.selectedDropletAuthor="";
    this.activeDropletColumn = this.dropletColumns[0];
    this.autoCompleteDroplets = [];
    this.dropletsSearchTerms = [];

    // Buckets
    this.filteredBuckets = [];
    this.allBucketsSelected = false;
    this.autoCompleteBuckets = [];
    this.bucketsSearchTerms = [];
    this.bucketsSearchTerm;
    this.isMultiBucketActionsDisabled = true;

    // Users and Groups
    this.filteredUsers = [];
    this.filteredUserGroups = [];
    this.allUsersAndGroupsSelected = false;
    this.autoCompleteUsersAndGroups = [];
    this.usersSearchTerms = [];
    //</editor-fold>
};

NfRegistryService.prototype = {
    constructor: NfRegistryService,

    /**
     * Set the `breadCrumbState` for the breadcrumb animations.
     *
     * @param {string} state    The state. Valid values are 'in' or 'out'.
     */
    setBreadcrumbState: function (state) {
        this.breadCrumbState = state;
    },

    /**
     * Gets the droplet grid-list explorer component's active sorting column display label.
     *
     * @returns {string}
     */
    getSortByLabel: function () {
        var sortByColumn;
        var arrayLength = this.dropletColumns.length;
        for (var i = 0; i < arrayLength; i++) {
            if (this.dropletColumns[i].active === true) {
                sortByColumn = this.dropletColumns[i];
                break;
            }
        }

        if (sortByColumn) {
            var label = '';
            switch (sortByColumn.label) {
                case 'Updated':
                    label = (sortByColumn.sortOrder === 'ASC') ? 'Oldest (update)' : 'Newest (update)';
                    break;
                case 'Name':
                    label = (sortByColumn.sortOrder === 'ASC') ? 'Name (a - z)' : 'Name (z - a)';
                    break;
            }
            return label;
        }
    },

    /**
     * Generates the droplet grid-list explorer component's sorting menu options.
     *
     * @param col           One of the available `dropletColumns`.
     * @returns {string}
     */
    generateSortMenuLabels: function (col) {
        var label = '';
        switch (col.label) {
            case 'Updated':
                label = (col.sortOrder !== 'ASC') ? 'Oldest (update)' : 'Newest (update)';
                break;
            case 'Name':
                label = (col.sortOrder !== 'ASC') ? 'Name (a - z)' : 'Name (z - a)';
                break;
        }
        return label;
    },

    /**
     * Execute the given droplet action.
     *
     * @param action        The action object.
     * @param droplet       The droplet object the `action` will act upon.
     */
    executeDropletAction: function (action, droplet) {
        var self = this;
        if (action.toLowerCase() === 'delete') {
            this.dialogService.openConfirm({
                title: 'Delete ' + droplet.type.toLowerCase(),
                message: 'All versions of this ' + droplet.type.toLowerCase() + ' will be deleted.',
                cancelButton: 'Cancel',
                acceptButton: 'Delete',
                acceptButtonColor: 'fds-regular'
            }).afterClosed().subscribe(
                function (accept) {
                    if (accept) {
                        self.api.deleteDroplet(droplet.link.href).subscribe(function (response) {
                            self.droplets = self.droplets.filter(function (d) {
                                return (d.identifier !== droplet.identifier) ? true : false
                            });
                            var snackBarRef = self.snackBarService.openCoaster({
                                title: 'Success',
                                message: 'All versions of this ' + droplet.type.toLowerCase() + ' have been deleted.',
                                verticalPosition: 'bottom',
                                horizontalPosition: 'right',
                                icon: 'success-toaster-icon',
                                color: '#1EB475',
                                duration: 3000
                            });
                            self.droplet = {};
                            self.filterDroplets();
                            
                        });
                    }
                });
        }
    },

    /**
     * Retrieves the snapshot metadata for the given droplet.
     *
     * @param droplet       The droplet.
     */
    getDropletSnapshotMetadata: function (droplet) {
        this.api.getDropletSnapshotMetadata(droplet.link.href, true).subscribe(function (snapshotMetadata) {
            droplet.snapshotMetadata = snapshotMetadata;
        //  this.nfRegistryService.selectedDropletAuthor = snapshotMetadata[0].author;
        });
    },

    /**
     * Sort `filteredDroplets` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortDroplets: function (column) {
        if (column.sortable === true) {
            // toggle column sort order
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
            this.filterDroplets(column.name, sortOrder);
            //only one column can be actively sorted so we reset all to inactive
            this.dropletColumns.forEach(function (c) {
                c.active = false;
            });
            //and set this column as the actively sorted column
            column.active = true;
            this.activeDropletColumn = column;
        }
    },
    
    aboutPage: function(){
                this.dialogService.openAboutPage({
                title: 'Delete ',
                message: 'All versions of this will be deleted.',
                cancelButton: 'Cancel',
                acceptButton: 'Delete',
                acceptButtonColor: 'fds-regular'
            }).afterClosed().subscribe(
                function (accept) {
                });
    },
//    sessionExpiredDialog:function(){
//      this.dialogService.openAboutPage({
//               disableClose:true
//            }).afterClosed().subscribe(
//                function (accept) {
//                });  
//    },

    /**
     * Filter droplets.
     *
     * @param {string} [sortBy]       The column name to sort `dropletColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterDroplets: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC'
        }
        // if `sortBy` is `undefined` then find the first sortable column in `dropletColumns`
        if (sortBy === undefined) {
            var arrayLength = this.dropletColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.dropletColumns[i].sortable === true) {
                    sortBy = this.dropletColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.dropletColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.dropletColumns[i].active = true;
                    this.dropletColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newData;

        // if we are viewing a single droplet
        if (this.droplet.identifier) {
            newData = [this.droplet];
        } else {
            newData = this.droplets;
        }

        for (var i = 0; i < this.dropletsSearchTerms.length; i++) {
            newData = this.dataTableService.filterData(newData, this.dropletsSearchTerms[i], true);
        }

        newData = this.dataTableService.sortData(newData, sortBy, sortOrder);
        this.filteredDroplets = newData;
        this.getAutoCompleteDroplets();
    },

    /**
     * Generates the `autoCompleteDroplets` options for the droplet filter.
     */
    getAutoCompleteDroplets: function () {
        var self = this;
        this.autoCompleteDroplets = [];
        this.dropletColumns.forEach(function (c) {
            return self.filteredDroplets.forEach(function (r) {
                return (r[c.name.toLowerCase()]) ? self.autoCompleteDroplets.push(r[c.name.toLowerCase()].toString()) : '';
            })
        });
    },

    /**
     * Execute the given bucket action.
     *
     * @param action        The action object.
     * @param bucket        The bucket object the `action` will act upon.
     */
    executeBucketAction: function (action, bucket) {
        var self = this;
        switch (action) {
            case 'delete':
                this.dialogService.openConfirm({
                    title: 'Delete Bucket',
                    message: 'All items stored in this bucket will be deleted as well.',
                    cancelButton: 'Cancel',
                    acceptButton: 'Delete',
                    acceptButtonColor: 'fds-regular'
                }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.api.deleteBucket(bucket.identifier).subscribe(function (response) {
                                self.buckets = self.buckets.filter(function (b) {
                                    return b.identifier !== bucket.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'All versions of all items in this bucket, as well as the bucket, have been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.bucket = {};
                                self.filterBuckets();
                                self.determineAllBucketsSelectedState();
                            });
                        }
                    });
                break;
            case 'manage':
                this.router.navigateByUrl('/dataintegration-registry/administration/workflow(' + action.type + ':' + action.name + '/bucket/' + bucket.identifier + ')');
                break;
            default:
                break;
        }
    },

    /**
     * Filter buckets and sets the `isMultiBucketActionsDisabled` property accordingly.
     *
     * @param {string} sortBy       The column name to sort `bucketColumns` by.
     * @param {string} sortOrder    The order. Either 'ASC' or 'DES'
     */
    filterBuckets: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC'
        }

        // if `sortBy` is `undefined` then find the first sortable column in this.bucketColumns
        if (sortBy === undefined) {
            var arrayLength = this.bucketColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.bucketColumns[i].sortable === true) {
                    sortBy = this.bucketColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.bucketColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.bucketColumns[i].active = true;
                    this.bucketColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newData = this.buckets;

        for (var i = 0; i < this.bucketsSearchTerms.length; i++) {
            newData = this.dataTableService.filterData(newData, this.bucketsSearchTerms[i], true);
        }

        newData = this.dataTableService.sortData(newData, sortBy, sortOrder);
        this.filteredBuckets = newData;

        var selected = 0;
        this.filteredBuckets.forEach(function (filteredBucket) {
            if (filteredBucket.checked) {
                selected++;
            }
        });

        this.isMultiBucketActionsDisabled = (selected > 0) ? false : true;

        this.getAutoCompleteBuckets();
    },

    /**
     * Generates the `autoCompleteBuckets` options for the bucket filter.
     */
    getAutoCompleteBuckets: function () {
        var self = this;
        this.autoCompleteBuckets = [];
        this.bucketColumns.forEach(function (c) {
            return self.filteredBuckets.forEach(function (r) {
                return (r[c.name.toLowerCase()]) ? self.autoCompleteBuckets.push(r[c.name.toLowerCase()].toString()) : '';
            });
        });
    },

    /**
     * Sort `filteredBuckets` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortBuckets: function (column) {
        if (column.sortable === true) {
            // toggle column sort order
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
            this.filterBuckets(column.name, sortOrder);
            //only one column can be actively sorted so we reset all to inactive
            this.bucketColumns.forEach(function (c) {
                c.active = false;
            });
            //and set this column as the actively sorted column
            column.active = true;
        }
    },

    /**
     * Returns true if each bucket in the `filteredBuckets` are selected and sets the `isMultiBucketActionsDisabled`
     * property accordingly.
     *
     * @returns {boolean}
     */
    allFilteredBucketsSelected: function () {
        var selected = 0;
        var allSelected = true;
        var disableMultiBucketDeleteAction = false;
        this.filteredBuckets.forEach(function (bucket) {
            if (bucket.checked) {
                selected++;
            }
            if (bucket.checked === undefined || bucket.checked === false) {
                allSelected = false;
            }
            if (bucket.permissions.canDelete === false) {
                disableMultiBucketDeleteAction = true;
            }
        });

        this.disableMultiBucketDeleteAction = disableMultiBucketDeleteAction;
        this.isMultiBucketActionsDisabled = (selected > 0) ? false : true;
        return allSelected;
    },

    /**
     * Checks each of the `filteredBuckets`'s `checked` property state and sets the `allBucketsSelected`
     * property accordingly.
     */
    determineAllBucketsSelectedState: function () {
        if (this.allFilteredBucketsSelected()) {
            this.allBucketsSelected = true;
        } else {
            this.allBucketsSelected = false;
        }
    },

    /**
     * Checks the `allBucketsSelected` property state and either selects
     * or deselects all filtered buckets.
     */
    toggleBucketsSelectAll: function () {
        if (this.allBucketsSelected) {
            this.selectAllBuckets();
        } else {
            this.deselectAllBuckets();
        }
    },

    /**
     * Sets the `checked` property of each filtered bucket to true and sets
     * the `isMultiBucketActionsDisabled` property accordingly.
     */
    selectAllBuckets: function () {
        this.filteredBuckets.forEach(function (c) {
            c.checked = true;
        });
        this.isMultiBucketActionsDisabled = false;
    },

    /**
     * Sets the `checked` property of each filtered bucket to false and sets
     * the `isMultiBucketActionsDisabled` property accordingly.
     */
    deselectAllBuckets: function () {
        this.filteredBuckets.forEach(function (c) {
            c.checked = false;
        });
        this.isMultiBucketActionsDisabled = true;
    },

    /**
     * Removes a `searchTerm` from the `bucketsSearchTerms` and filters the `buckets`.
     *
     * @param {string} searchTerm The search term to remove.
     */
    bucketsSearchRemove: function (searchTerm) {
        //only remove the first occurrence of the search term
        var index = this.bucketsSearchTerms.indexOf(searchTerm);
        if (index !== -1) {
            this.bucketsSearchTerms.splice(index, 1);
        }
        this.filterBuckets();
        this.determineAllBucketsSelectedState();
    },

    /**
     * Adds a `searchTerm` from the `bucketsSearchTerms` and filters the `buckets`.
     *
     * @param {string} searchTerm The search term to add.
     */
    bucketsSearchAdd: function (searchTerm) {
        this.bucketsSearchTerms.push(searchTerm);
        this.filterBuckets();
        this.determineAllBucketsSelectedState();
    },

    /**
     * Deletes all versions of all flows of each selected bucket
     */
    deleteSelectedBuckets: function () {
        var self = this;
        this.dialogService.openConfirm({
            title: 'Delete Buckets',
            message: 'All versions of all flows of each selected bucket will be deleted.',
            cancelButton: 'Cancel',
            acceptButton: 'Delete',
            acceptButtonColor: 'fds-regular'
        }).afterClosed().subscribe(
            function (accept) {
                if (accept) {
                    self.filteredBuckets.forEach(function (filteredBucket) {
                        if (filteredBucket.checked) {
                            self.api.deleteBucket(filteredBucket.identifier).subscribe(function (response) {
                                self.buckets = self.buckets.filter(function (bucket) {
                                    return bucket.identifier !== filteredBucket.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'All versions of all items in ' + filteredBucket.name + ' have been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.filterBuckets();
                            });
                        }
                    });
                    self.determineAllBucketsSelectedState();
                }
            });
    },

    /**
     * Sort `users` and `groups` by `column`.
     *
     * @param column    The column to sort by.
     */
    sortUsersAndGroups: function (column) {
        if (column.sortable) {
            var sortBy = column.name;
            var sortOrder = column.sortOrder = (column.sortOrder === 'ASC') ? 'DESC' : 'ASC';
            this.filterUsersAndGroups(sortBy, sortOrder);

            //only one column can be actively sorted so we reset all to inactive
            this.userColumns.forEach(function (c) {
                c.active = false;
            });
            //and set this column as the actively sorted column
            column.active = true;
        }
    },

    /**
     * Loads the current user and updates the current user locally.
     *
     * @returns xhr
     */
    loadCurrentUser: function () {
        var self = this;
        // get the current user
        return rxjs.Observable.of(this.api.loadCurrentUser().subscribe(function (currentUser) {
            // if the user is logged, we want to determine if they were logged in using a certificate
            if (currentUser.anonymous === false) {
                // render the users name
                self.currentUser = currentUser;

                // render the logout button if there is a token locally
                if (self.nfStorage.getItem('jwt') !== null) {
                    self.currentUser.canLogout = true;
                }
            } else {
                // set the anonymous user label
                self.nfRegistryService.currentUser.identity = 'Anonymous';
            }
        }));
    },

    /**
     * Adds a `searchTerm` to the `usersSearchTerms` and filters the `users` amd `groups`.
     *
     * @param {string} searchTerm   The search term to add.
     */
    usersSearchRemove: function (searchTerm) {
        //only remove the first occurrence of the search term
        var index = this.usersSearchTerms.indexOf(searchTerm);
        if (index !== -1) {
            this.usersSearchTerms.splice(index, 1);
        }
        this.filterUsersAndGroups();
        this.determineAllUsersAndGroupsSelectedState();
    },

    /**
     * Removes a `searchTerm` from the `usersSearchTerms` and filters the `users` amd `groups`.
     *
     * @param {string} searchTerm   The search term to remove.
     */
    usersSearchAdd: function (searchTerm) {
        this.usersSearchTerms.push(searchTerm);
        this.filterUsersAndGroups();
        this.determineAllUsersAndGroupsSelectedState();
    },

    /**
     * Filter users and groups.
     *
     * @param {string} [sortBy]       The column name to sort `userGroupsColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterUsersAndGroups: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC'
        }
        // if `sortBy` is `undefined` then find the first sortable column in `dropletColumns`
        if (sortBy === undefined) {
            var arrayLength = this.userColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.userColumns[i].sortable === true) {
                    sortBy = this.userColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.userColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.userColumns[i].active = true;
                    this.userColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newUsersData = this.users;
        var newUserGroupsData = this.groups;

        for (var i = 0; i < this.usersSearchTerms.length; i++) {
            newUsersData = this.dataTableService.filterData(newUsersData, this.usersSearchTerms[i], true);
        }

        newUsersData = this.dataTableService.sortData(newUsersData, sortBy, sortOrder);
        this.filteredUsers = newUsersData;

        for (var i = 0; i < this.usersSearchTerms.length; i++) {
            newUserGroupsData = this.dataTableService.filterData(newUserGroupsData, this.usersSearchTerms[i], true);
        }

        newUserGroupsData = this.dataTableService.sortData(newUserGroupsData, sortBy, sortOrder);
        this.filteredUserGroups = newUserGroupsData;

        this.getAutoCompleteUserAndGroups();
    },

    /**
     * Checks each of the `filteredUsers` and each of the `filteredUserGroups` `checked` property state and sets
     * the `allUsersAndGroupsSelected` property accordingly.
     */
    determineAllUsersAndGroupsSelectedState: function () {
        var allSelected = true;
        var disableMultiDeleteAction = false;
        this.filteredUserGroups.forEach(function (group) {
            if (group.checked === undefined || group.checked === false) {
                allSelected = false;
            }
            if (group.checked && group.configurable === false) {
                disableMultiDeleteAction = true;
            }
        });

        this.filteredUsers.forEach(function (user) {
            if (user.checked === undefined || user.checked === false) {
                allSelected = false;
            }
            if (user.checked && user.configurable === false) {
                disableMultiDeleteAction = true;
            }
        });
        this.disableMultiDeleteAction = disableMultiDeleteAction;
        this.allUsersAndGroupsSelected = allSelected;
    },

    /**
     * Gets the currently selected groups.
     *
     * @returns {Array.<T>}     The selected groups.
     */
    getSelectedGroups: function () {
        return this.filteredUserGroups.filter(function (filteredUserGroup) {
            return filteredUserGroup.checked;
        });
    },

    /**
     * Gets the currently selected users.
     *
     * @returns {Array.<T>}     The selected users.
     */
    getSelectedUsers: function () {
        return this.filteredUsers.filter(function (filteredUser) {
            return filteredUser.checked;
        });
    },

    /**
     * Checks the `allUsersAndGroupsSelected` property state and either selects
     * or deselects all `filteredUsers` and each `filteredUserGroups`.
     */
    toggleUsersSelectAll: function () {
        if (this.allUsersAndGroupsSelected) {
            this.selectAllUsersAndGroups();
        } else {
            this.deselectAllUsersAndGroups();
        }
    },

    /**
     * Sets the `checked` property of each `filteredUsers` and each `filteredUserGroups` to true and sets
     * the `allUsersAndGroupsSelected` properties accordingly.
     */
    selectAllUsersAndGroups: function () {
        this.filteredUsers.forEach(function (c) {
            c.checked = true;
        });
        this.filteredUserGroups.forEach(function (c) {
            c.checked = true;
        });
        this.determineAllUsersAndGroupsSelectedState();
    },

    /**
     * Sets the `checked` property of each `filteredUsers` and each `filteredUserGroups` to false and sets
     * the `allUsersAndGroupsSelected` properties accordingly.
     */
    deselectAllUsersAndGroups: function () {
        this.filteredUsers.forEach(function (c) {
            c.checked = false;
        });
        this.filteredUserGroups.forEach(function (c) {
            c.checked = false;
        });
        this.determineAllUsersAndGroupsSelectedState();
    },

    /**
     * Generates the `autoCompleteUsersAndGroups` options for the users and groups data table filter.
     */
    getAutoCompleteUserAndGroups: function () {
        var self = this;
        this.autoCompleteUsersAndGroups = [];
        this.userColumns.forEach(function (c) {
            var usersAndGroups = self.filteredUsers.concat(self.filteredUserGroups);
            usersAndGroups.forEach(function (r) {
                (r[c.name.toLowerCase()]) ? self.autoCompleteUsersAndGroups.push(r[c.name.toLowerCase()].toString()) : '';
            });
        });
    },

    /**
     * Execute the given user action.
     *
     * @param action        The action object.
     * @param user          The user object the `action` will act upon.
     */
    executeUserAction: function (action, user) {
        var self = this;
        this.user = user;
        switch (action.name.toLowerCase()) {
            case 'delete':
                return this.dialogService.openConfirm({
                    title: 'Delete User',
                    message: 'This user will lose all access to the registry.',
                    cancelButton: 'Cancel',
                    acceptButton: 'Delete',
                    acceptButtonColor: 'fds-regular'
                }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.api.deleteUser(user.identifier).subscribe(function (response) {
                                self.users = self.users.filter(function (u) {
                                    return u.identifier !== user.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'User: ' + user.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.filterUsersAndGroups();
                                self.determineAllUsersAndGroupsSelectedState();
                            });
                        }
                    });
                break;
            case 'manage':
                this.router.navigateByUrl('/dataintegration-registry/administration/explorer/users(' + action.type + ':' + action.name + '/user/' + user.identifier + ')');
                break;
            default:
                break;
        }
    },

    /**
     * Execute the given group action.
     *
     * @param action        The action object.
     * @param group          The group object the `action` will act upon.
     */
    executeGroupAction: function (action, group) {
        var self = this;
        this.group = group;
        switch (action.name.toLowerCase()) {
            case 'delete':
                this.dialogService.openConfirm({
                    title: 'Delete Group',
                    message: 'All policies granted to this group will be deleted as well.',
                    cancelButton: 'Cancel',
                    acceptButton: 'Delete',
                    acceptButtonColor: 'fds-regular'
                }).afterClosed().subscribe(
                    function (accept) {
                        if (accept) {
                            self.api.deleteUserGroup(group.identifier).subscribe(function (response) {
                                self.groups = self.groups.filter(function (u) {
                                    return u.identifier !== group.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'Group: ' + group.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.filterUsersAndGroups();
                                self.determineAllUsersAndGroupsSelectedState();
                            });
                        }
                    });
                break;
            case 'manage':
                this.router.navigateByUrl('/dataintegration-registry/administration/users(' + action.type + ':' + action.name + '/group/' + group.identifier + ')');
                break;
            default:
                break;
        }
    },
    contextMenu:function(){
        if(this.umpEnabledStatus === true){
              $("#enable-security-dlg").css("display","none");
              $('.conetxt-menu-style').css("height","65px");
        }
        else{
              $("#enable-security-dlg").css("display","block");
              $('.conetxt-menu-style').css("height","87px");
        }
    },
    
    LogoutMenu:function(){
         if(this.umpEnabledStatus === true){
              $("#change-password-provider").css("display","none");
              $('.logout-conetxt-menu-style').css("height","32px");
        }
        else{
              $("#change-password-provider").css("display","block");
              $('.logout-conetxt-menu-style').css("height","60px");
        }
    },
    
    helpPage:function () {
        window.open("https://help.syncfusion.com/data-integration/overview");
    },
    
    enableSecurityDlg:function(){
        this.router.navigateByUrl('dataintegration-registry/login/enable-security');
    },
    /**
     * Deletes all selected `filteredUserGroups` and `filteredUsers` and sets the `allUsersAndGroupsSelected`
     * property accordingly.
     */
    deleteSelectedUsersAndGroups: function () {
        var self = this;
        this.dialogService.openConfirm({
            title: 'Delete Users/Groups',
            message: 'The selected users will lose all access to the registry and all policies granted to the selected groups will be deleted.',
            cancelButton: 'Cancel',
            acceptButton: 'Delete',
            acceptButtonColor: 'fds-regular'
        }).afterClosed().subscribe(
            function (accept) {
                if (accept) {
                    self.filteredUserGroups.forEach(function (filteredUserGroup) {
                        if (filteredUserGroup.checked) {
                            self.api.deleteUserGroup(filteredUserGroup.identifier).subscribe(function (response) {
                                self.groups = self.groups.filter(function (u) {
                                    return u.identifier !== filteredUserGroup.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'User group: ' + filteredUserGroup.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.filterUsersAndGroups();
                            });
                        }
                    });
                    self.filteredUsers.forEach(function (filteredUser) {
                        if (filteredUser.checked) {
                            self.api.deleteUser(filteredUser.identifier).subscribe(function (response) {
                                self.users = self.users.filter(function (u) {
                                    return u.identifier !== filteredUser.identifier;
                                });
                                var snackBarRef = self.snackBarService.openCoaster({
                                    title: 'Success',
                                    message: 'User: ' + filteredUser.identity + ' has been deleted.',
                                    verticalPosition: 'bottom',
                                    horizontalPosition: 'right',
                                    icon: 'success-toaster-icon',
                                    color: '#1EB475',
                                    duration: 3000
                                });
                                self.filterUsersAndGroups();
                            });
                        }
                    });
                    self.determineAllUsersAndGroupsSelectedState();
                }
            });
    },


    /**
     * Utility method that performs the custom search capability for data tables.
     *
     * @param data          The data to search.
     * @param searchTerm    The term we are looking for.
     * @param ignoreCase    Ignore case.
     * @returns {*}
     */
    experimental_filterData: function (data, searchTerm, ignoreCase) {
        var field = '';
        if (searchTerm.indexOf(":") > -1) {
            field = searchTerm.split(':')[0].trim();
            searchTerm = searchTerm.split(':')[1].trim();
        }
        var filter = searchTerm ? (ignoreCase ? searchTerm.toLowerCase() : searchTerm) : '';

        if (filter) {
            data = data.filter(function (item) {
                var res = Object.keys(item).find(function (key) {
                    if (key !== field && field !== '') {
                        return false;
                    }
                    var preItemValue = ('' + item[key]);
                    var itemValue = ignoreCase ? preItemValue.toLowerCase() : preItemValue;
                    return itemValue.indexOf(filter) > -1;
                });
                return !(typeof res === 'undefined');
            });
        }
        return data;
    },
    
    /**
     * method that performs the custom search capability for bucket tables.
     * @param searchTerm    The term we are looking for.
     */
    searchBuckets:function(){
        this.bucketsSearchTerm=$(".search-textbox").val();
        if(this.bucketsSearchTerm === ''){
            this.isFilteredBuckets = false;
         this.isbucketFiltered = false;    
        }
        else
        this.isbucketFiltered = true; 
        
        var newData = this.buckets;
        newData = this.dataTableService.filterData(newData, this.bucketsSearchTerm, true);
        this.filteredBuckets = newData;      
    },
    
     searchBucketsCloseBtn:function(){
        this.filteredBuckets = this.buckets;
         $("#SearchBuckets").val('');
    },

     /**
     * Filter policies.
     *
     * @param {string} [sortBy]       The column name to sort `bucketPoliciesColumns` by.
     * @param {string} [sortOrder]    The order. Either 'ASC' or 'DES'
     */
    filterPolicies: function (sortBy, sortOrder) {
        // if `sortOrder` is `undefined` then use 'ASC'
        if (sortOrder === undefined) {
            sortOrder = 'ASC';
        }
        // if `sortBy` is `undefined` then find the first sortable column in `bucketPoliciesColumns`
        if (sortBy === undefined) {
            var arrayLength = this.bucketPoliciesColumns.length;
            for (var i = 0; i < arrayLength; i++) {
                if (this.bucketPoliciesColumns[i].sortable === true) {
                    sortBy = this.bucketPoliciesColumns[i].name;
                    //only one column can be actively sorted so we reset all to inactive
                    this.bucketPoliciesColumns.forEach(function (c) {
                        c.active = false;
                    });
                    //and set this column as the actively sorted column
                    this.bucketPoliciesColumns[i].active = true;
                    this.bucketPoliciesColumns[i].sortOrder = sortOrder;
                    break;
                }
            }
        }

        var newUserPermsData = [];
        this.filteredUserPermsData=[];
        this.filteredGroupPermsData=[];
        this.userIdentitiesWithPolicies = [];
        for (var identity in this.userPerms) {
            if (this.userPerms.hasOwnProperty(identity)) {
                this.userIdentitiesWithPolicies.push(identity);
                    if(this.selectedIdentity === identity){
                      newUserPermsData.push({identity: identity,type:'user',permissions: this.userPerms[identity].join("   "),isEdited:'true'});  
                    }
                    else
                   newUserPermsData.push({identity: identity,type:'user',permissions: this.userPerms[identity].join("   "),isEdited:'false'});
            }
        }

        for (var i = 0; i < this.userPermsSearchTerms.length; i++) {
            newUserPermsData = this.filterData(newUserPermsData, this.userPermsSearchTerms[i], true);
        }

        newUserPermsData = this.dataTableService.sortData(newUserPermsData, sortBy, sortOrder);
        this.filteredUserPermsData = newUserPermsData;
        this.userPermsData=newUserPermsData;
        var newGroupPermsData = [];
        this.groupIdentitiesWithPolicies = [];
        for (var identity in this.groupPerms) {
            if (this.groupPerms.hasOwnProperty(identity)) {
                this.groupIdentitiesWithPolicies.push(identity);
                  if(this.selectedIdentity === identity){
                      newGroupPermsData.push({identity: identity,type:'group',permissions: this.groupPerms[identity].join("   "),isEdited:'true'});  
                    }
                    else
                   newGroupPermsData.push({identity: identity,type:'group',permissions: this.groupPerms[identity].join("   "),isEdited:'false'});
            }
        }

        for (var i = 0; i < this.userPermsSearchTerms.length; i++) {
            newGroupPermsData = this.filterData(newGroupPermsData, this.userPermsSearchTerms[i], true);
        }

        newGroupPermsData = this.dataTableService.sortData(newGroupPermsData, sortBy, sortOrder);
        this.filteredGroupPermsData = newGroupPermsData;
        this.groupPermsData=newGroupPermsData;
    },
      /**
     * method that performs the custom search capability for bucket tables.
     * @param searchTerm    The term we are looking for.
     */
    openRemoveFilter:function(){
        $(".cancel-search-icon").css("display","block");
    },
        
    /**
     * method that performs the custom search capability for bucket tables.
     * @param searchTerm    The term we are looking for.
     */
    removeFilter:function(){
        this.filteredBuckets =this.buckets;
    },
       
    isLoggedIn: function(){
        var isLoginStatus = true;
        if(window.location.protocol === "http:"){
            if(localStorage.getItem(window.location.hostname+"-status") === null || localStorage.getItem(window.location.hostname+"-status") === "false")
             isLoginStatus = false;   
        }
        return isLoginStatus;
    }
};

NfRegistryService.parameters = [
    NfRegistryApi,
    NfStorage,
    covalentCore.TdDataTableService,
    ngRouter.Router,
    ngMaterial.MatDialog,
    fdsDialogsModule.FdsDialogService,
    fdsSnackBarsModule.FdsSnackBarService,
];

module.exports = NfRegistryService;