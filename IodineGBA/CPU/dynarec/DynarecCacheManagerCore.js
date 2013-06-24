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
function DynarecCacheManagerCore(cpu, start, end, InTHUMB, CPUMode) {
	this.CPUCore = cpu;
    this.start = start | 0;
    this.end = end | 0;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.badCount = 0;
    this.hotCount = 0;
    this.record = [];
    this.cache = null;
    this.worker = null;
    this.compiling = false;
}
DynarecCacheManagerCore.prototype.MAGIC_HOT_COUNT = 10;
DynarecCacheManagerCore.prototype.MAGIC_BAD_COUNT = 10;
DynarecCacheManagerCore.prototype.ready = function () {
    return !!this.cache;
}
DynarecCacheManagerCore.prototype.execute = function () {
    //Execute stub:
    this.cache(this);
}
DynarecCacheManagerCore.prototype.tickHotness = function () {
    if (!this.cache) {
        if (this.badCount <= this.MAGIC_BAD_COUNT) {
            ++this.hotCount;
            if (this.hotCount >= this.MAGIC_HOT_COUNT) {
                this.compile();
            }
        }
    }
}
DynarecCacheManagerCore.prototype.bailout = function () {
    this.cache = null;
    ++this.badCount;
}
DynarecCacheManagerCore.prototype.compile = function () {
    //Make sure there isn't another worker compiling:
    if (!this.CPUCore.dynarec.compiling) {
        this.record = [];
        var start = this.start;
        while (start < this.end) {
            //Build up a record of bytecode to pass to the worker to compile:
            this.record.push(this.read(start));
        }
        try {
            var parentObj = this;
            this.worker = new Worker("IodineGBA/CPU/dynarec/DynarecCompilerWorkerCore.js");
            this.worker.onmessage = function (message) {
                var code = message[0];
                switch (code) {
                        //Got the code block back:
                    case 0:
                        parentObj.cache = new Function(message[1]);
                        parentObj.compiling = false;
                        break;
                        //Compiler returned an error:
                    case 1:
                        parentObj.bailout();
                }
                //Destroy the worker:
                parentObj.worker = null;
            }
            //Put a lock on the compiler:
            this.CPUCore.dynarec.compiling = true;
            //Pass the record memory and state:
            this.worker.postMessage([this.record, this.InTHUMB, this.CPUMode]);
        }
        catch (error) {
            //Browser doesn't support webworkers, so disable dynarec:
            this.CPUCore.emulatorCore.dynarecEnabled = false;
        }
    }
}