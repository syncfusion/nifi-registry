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
var $ = require('jquery');
var ngCore = require('@angular/core');
var NfRegistryService = require('nifi-registry/services/nf-registry.service.js');
var nfRegistryAnimations = require('nifi-registry/nf-registry.animations.js');
var ngRouter = require('@angular/router');
/**
 * NfRegistryExplorer constructor.
 *
 * @param nfRegistryService     The nf-registry.service module.
 * @constructor
 */
function NfRegistryExplorer(nfRegistryService,router) {
    //Services
    this.nfRegistryService = nfRegistryService;
    this.router = router;
    
   $(document).click(function (event) {
        if ($("#ums-application-container").css("display") !== "none") {
            if (!event.target.matches('.applicationLogo') && !event.target.matches('.app-tile') &&
                    !event.target.matches('.app-tile-caption') && !event.target.matches('.app-tile-icon')
                    && !event.target.matches('.application-image'))
                $("#ums-application-container").css("display", "none");
        }
    });
};

NfRegistryExplorer.prototype = {
    constructor: NfRegistryExplorer,

    /**
     * Initialize the component
     */
    ngOnInit: function () {
        var self = this;
        if(self.nfRegistryService.isLoggedIn() === false)
        {
           self.router.navigateByUrl('dataintegration-registry/login/dataintegration-login');  
        }
        else{
        this.nfRegistryService.perspective = 'explorer';  
    }
    },

    /**
     * Destroy the component.
     */
    ngOnDestroy: function () {
        this.nfRegistryService.bucket = {};
        this.nfRegistryService.droplet = {};
        this.nfRegistryService.explorerViewType = '';
        this.nfRegistryService.buckets = [];
        this.nfRegistryService.droplets = [];
        this.nfRegistryService.filteredDroplets = [];
        this.nfRegistryService.perspective = '';
        this.nfRegistryService.selectedDroplet=[];
        this.nfRegistryService.selectedDropletAuthor="";
    }
};

NfRegistryExplorer.annotations = [
    new ngCore.Component({
        template: require('./nf-registry-explorer.html!text'),
        animations: [nfRegistryAnimations.slideInLeftAnimation],
        host: {
            '[@routeAnimation]': 'routeAnimation'
        }
    })
];

NfRegistryExplorer.parameters = [
    NfRegistryService,
    ngRouter.Router
];

module.exports = NfRegistryExplorer;
