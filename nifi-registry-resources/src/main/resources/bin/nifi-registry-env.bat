@echo off
rem
rem    Licensed to the Apache Software Foundation (ASF) under one or more
rem    contributor license agreements.  See the NOTICE file distributed with
rem    this work for additional information regarding copyright ownership.
rem    The ASF licenses this file to You under the Apache License, Version 2.0
rem    (the "License"); you may not use this file except in compliance with
rem    the License.  You may obtain a copy of the License at
rem
rem       http://www.apache.org/licenses/LICENSE-2.0
rem
rem    Unless required by applicable law or agreed to in writing, software
rem    distributed under the License is distributed on an "AS IS" BASIS,
rem    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
rem    See the License for the specific language governing permissions and
rem    limitations under the License.
rem

set FWDIR=%~sdp0..\
set JAVA_HOME=%FWDIR%..\..\Java\jdk_x64

set NIFI_REGISTRY_HOME=%~sdp0..

rem The directory for the NiFi Registry pid file
set NIFI_REGISTRY_PID_DIR=%NIFI_REGISTRY_HOME%\run

rem The directory for NiFi Registry log files
set NIFI_REGISTRY_LOG_DIR=%NIFI_REGISTRY_HOME%\logs