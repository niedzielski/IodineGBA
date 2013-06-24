"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2013 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
var record = null;
var InTHUMB = false;
var CPUMode = 0x10;
var compiler = null;
self.onmessage = function (info) {
    record = info[0];
    InTHUMB = info[1];
    CPUMode = info[2];
    compiler = new DynarecCompilerWorkerCore(record, InTHUMB, CPUMode);
}
function bailout() {
    postMessage([1]);
}
function done(functionString) {
    postMessage([0, functionString]);
}
function DynarecCompilerWorkerCore(record, InTHUMB, CPUMode) {
    
}