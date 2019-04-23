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
/* global getDipVersion */

var $ = require('jquery');
var ngCore = require('@angular/core');

/**
 * FdsSessionExpiredDialogComponent constructor.
 *
 * @constructor
 */
function FdsSessionExpiredDialogComponent() {
    this.title = '';
    this.message = '';
    this.dialogRef = undefined;
    this.viewContainerRef = undefined;
    this.disableClose = false;
};

FdsSessionExpiredDialogComponent.prototype = {
    constructor: FdsSessionExpiredDialogComponent,

    /**
     * Close the dialog and send a cancel response to any subscribers.
     */
    cancel: function () {
        this.dialogRef.close(false);
    },

    /**
     * Close the dialog and send an accept response to any subscribers.
     */
    accept: function () {
        this.dialogRef.close(true);
    }
};

FdsSessionExpiredDialogComponent.annotations = [
    new ngCore.Component({
        selector: 'session-expired-dialog',
        template: require('./session-expired-dialog.html!text')
    })
];

FdsSessionExpiredDialogComponent.parameters = [];

module.exports = FdsSessionExpiredDialogComponent;
