<%--
 Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the 'License'); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an 'AS IS' BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
--%>
<%@ page contentType='text/html' pageEncoding='UTF-8' session='false' %>
<!DOCTYPE html>
<html>
<head>
   <title>Syncfusion Data Integration Registry</title>
    <base href='/'>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/>
    <link rel='shortcut icon' href='dataintegration-registry/images/data-integration.ico' type='image/png'>
    <link rel='icon' href='dataintegration-registry/images/data-integration.ico' type='image/png'>
    ${nf.registry.style.tags}
    <link rel='stylesheet' href='dataintegration-registry/node_modules/font-awesome/css/font-awesome.css'/>
    <link rel='stylesheet' href='dataintegration-registry/fonts/fusion-font/style.css'/>
    <link rel='stylesheet' href='dataintegration-registry/fusion-design/css/fusion.css'/>
    <!-- Bootstrap core CSS for alignment -->
     <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
   <script src="dataintegration-registry/fusion-design/js/jquery.min.js"></script>
   <script src="dataintegration-registry/fusion-design/js/fusion.js"></script>
</head>
<body>
<mat-progress-spinner id="loading-spinner" mode="indeterminate"></mat-progress-spinner>
<nf-registry-app></nf-registry-app>
</body>
${nf.registry.script.tags}
</html>