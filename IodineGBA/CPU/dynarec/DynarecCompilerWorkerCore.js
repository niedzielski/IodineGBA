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
importScripts("DynarecARMAssemblerCore.js", "DynarecTHUMBAssemblerCore.js");
self.onmessage = function (command) {
    var info = command.data;
    var startPC = info[0];
    var record = info[1];
    var InTHUMB = info[2];
    var CPUMode = info[3];
    var isROM = info[4];
    try {
        var compiler = new DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM);
    }
    catch (error) {
        //Compiler had an internal error, tell the manager about it:
        bailout();
    }
}
function bailout() {
    postMessage([1]);
}
function done(functionString) {
    postMessage([0, functionString]);
    self.close();
}
function DynarecCompilerWorkerCore(startPC, record, InTHUMB, CPUMode, isROM) {
    this.instructionsToJoin = [];
    this.pc = startPC | 0;
    this.record = record;
    this.InTHUMB = InTHUMB;
    this.CPUMode = CPUMode;
    this.isROM = isROM;
    this.totalClocks = 0;
    this.thumbAssembler = new DynarecTHUMBAssemblerCore(this);
    this.armAssembler = new DynarecARMAssemblerCore(this);
    this.compile();
    this.finish();
}
DynarecCompilerWorkerCore.prototype.compile = function () {
    var length = this.record.length;
    for (var index = 0; index < length; ++index) {
        this.instructionsToJoin.push(this.parseInstruction(this.record[index]));
        this.incrementPC();
    }
}
DynarecCompilerWorkerCore.prototype.parseInstruction = function (instructionValue) {
    var instuctionCode = this.decodeInstruction(instructionValue);
    this.incrementPC();
    return this.addRAMGuards(instructionValue, instuctionCode);
}
DynarecCompilerWorkerCore.prototype.incrementPC = function () {
    if (this.InTHUMB) {
        this.pc = (this.pc + 2) | 0;
    }
    else {
        this.pc = (this.pc + 4) | 0;
    }
}
DynarecCompilerWorkerCore.prototype.bailoutEarly = function () {
    var bailoutText = "cpu.registers[15] = " + this.pc + ";";
    bailoutText += this.addStateMachineUpdate();
    bailoutText += "return;";
    return bailoutText;
}
DynarecCompilerWorkerCore.prototype.addRAMGuards = function (instructionValue, instructionCode) {
    if (this.isROM) {
        return instructionCode;
    }
    var guardText = "var instruction = " +  this.addMemoryRead(pc) + ";";
    guardText += "if (instruction != " + instructionValue + ") {";
    guardText += this.bailoutEarly();
    guardText += "}";
    guardText += instructionCode;
}
DynarecCompilerWorkerCore.prototype.addClockChecks = function () {
    return "if (cpu.IOCore.cyclesUntilNextEvent() < " + this.totalClocks + ") { return; }";
}
DynarecCompilerWorkerCore.prototype.addStateMachineUpdate = function () {
    return "cpu.IOCore.updateCore(" + this.totalClocks + ");";
}
DynarecCompilerWorkerCore.prototype.finish = function () {
    var code = "function (cpu) {";
    code += this.addClockChecks();
    code += this.instructionsToJoin.join(";");
    code += this.addStateMachineUpdate();
    code += "}";
    done(code);
}
DynarecCompilerWorkerCore.prototype.decodeInstruction = function () {
    var genString = "";
    if (this.InTHUMB) {
        genString = this.thumbAssembler.generate(instructionValue);
    }
    else {
        genString = this.armAssembler.generate(instructionValue);
    }
    return genString;
}