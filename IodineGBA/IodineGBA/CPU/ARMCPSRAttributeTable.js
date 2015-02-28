"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2014 Grant Galitz
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
function ARMCPSRAttributeTable() {
    var FLAGS = getInt32Array(4);
    FLAGS[1] = 1;  //Reverse the zero flag.
    function setNegative(toSet) {
        FLAGS[0] = toSet | 0;
    };
    function setNegativeFalse() {
        FLAGS[0] = 0;
    };
    function getNegative() {
        return FLAGS[0] | 0;
    };
    function setZero(toSet) {
        FLAGS[1] = toSet | 0;
    };
    function setZeroTrue() {
        FLAGS[1] = 0;
    };
    function setZeroFalse() {
        FLAGS[1] = 1;
    };
    function getZero() {
        return FLAGS[1] | 0;
    };
    function setOverflowTrue() {
        FLAGS[3] = -1;
    };
    function setOverflowFalse() {
        FLAGS[3] = 0;
    };
    function getOverflow() {
        return FLAGS[3] | 0;
    };
    function setCarry(toSet) {
        FLAGS[2] = toSet | 0;
    };
    function setCarryFalse() {
        FLAGS[2] = 0;
    };
    function getCarry() {
        return FLAGS[2] | 0;
    };
    function getCarryReverse() {
        return ~FLAGS[2];
    };
    function checkConditionalCode(execute) {
        execute = execute | 0;
        /*
         Instruction Decode Pattern:
         C = Conditional Code Bit;
         X = Possible opcode bit;
         N = Data Bit, definitely not an opcode bit
         OPCODE: CCCCXXXXXXXXXXXXNNNNNNNNXXXXNNNN
         
         For this function, we decode the top 3 bits for the conditional code test:
         */
        switch (execute >>> 29) {
            case 0x4:
                if ((FLAGS[1] | 0) == 0) {
                    execute = -1;
                    break;
                }
            case 0x1:
                execute = ~FLAGS[2];
                break;
            case 0x2:
                execute = ~FLAGS[0];
                break;
            case 0x3:
                execute = ~FLAGS[3];
                break;
            case 0x6:
                if ((FLAGS[1] | 0) == 0) {
                    execute = -1;
                    break;
                }
            case 0x5:
                execute = FLAGS[0] ^ FLAGS[3];
                break;
            case 0x0:
                if ((FLAGS[1] | 0) != 0) {
                    execute = -1;
                    break;
                }
            default:
                execute = 0;
        }
        return execute | 0;
    };
    function setNZInt(toSet) {
        toSet = toSet | 0;
        FLAGS[0] = toSet | 0;
        FLAGS[1] = toSet | 0;
    };
    function setNZCV(toSet) {
        toSet = toSet | 0;
        FLAGS[0] = toSet | 0;
        FLAGS[1] = (~toSet) & 0x40000000;
        FLAGS[2] = toSet << 2;
        FLAGS[3] = toSet << 3;
    };
    function getNZCV() {
        var toSet = FLAGS[0] & 0x80000000;
        if ((FLAGS[1] | 0) == 0) {
            toSet = toSet | 0x40000000;
        }
        toSet = toSet | ((FLAGS[2] >>> 31) << 29);
        toSet = toSet | ((FLAGS[3] >>> 31) << 28);
        return toSet | 0;
    };
    function setADDFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) + (operand2 | 0)) | 0;
        FLAGS[1] = FLAGS[0] | 0;
        if ((FLAGS[0] >>> 0) < (operand1 >>> 0)) {
            FLAGS[2] = -1;
        }
        else {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (~(operand1 ^ operand2)) & (operand1 ^ FLAGS[0]);
        return FLAGS[0] | 0;
    };
    function setADCFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) + (operand2 | 0)) | 0;
        FLAGS[0] = ((FLAGS[0] | 0) + (FLAGS[2] >>> 31)) | 0;
        FLAGS[1] = FLAGS[0] | 0;
        if ((FLAGS[0] >>> 0) < (operand1 >>> 0)) {
            FLAGS[2] = -1;
        }
        else if ((FLAGS[0] >>> 0) > (operand1 >>> 0)) {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (~(operand1 ^ operand2)) & (operand1 ^ FLAGS[0]);
        return FLAGS[0] | 0;
    };
    function setSUBFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) - (operand2 | 0)) | 0;
        FLAGS[1] = FLAGS[0] | 0;
        if ((operand1 >>> 0) >= (operand2 >>> 0)) {
            FLAGS[2] = -1;
        }
        else {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (operand1 ^ operand2) & (operand1 ^ FLAGS[0]);
        return FLAGS[0] | 0;
    };
    function setSBCFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) - (operand2 | 0)) | 0;
        FLAGS[0] = ((FLAGS[0] | 0) - ((~FLAGS[2]) >>> 31)) | 0
        FLAGS[1] = FLAGS[0] | 0;
        if ((FLAGS[0] >>> 0) < (operand1 >>> 0)) {
            FLAGS[2] = -1;
        }
        else if ((FLAGS[0] >>> 0) > (operand1 >>> 0)) {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (operand1 ^ operand2) & (operand1 ^ FLAGS[0]);
        return FLAGS[0] | 0;
    };
    function setCMPFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) - (operand2 | 0)) | 0;
        FLAGS[1] = FLAGS[0] | 0;
        if ((operand1 >>> 0) >= (operand2 >>> 0)) {
            FLAGS[2] = -1;
        }
        else {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (operand1 ^ operand2) & (operand1 ^ FLAGS[0]);
    };
    function setCMNFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        FLAGS[0] = ((operand1 | 0) + (operand2 | 0)) | 0;
        FLAGS[1] = FLAGS[0] | 0;
        if ((FLAGS[0] >>> 0) < (operand1 >>> 0)) {
            FLAGS[2] = -1;
        }
        else {
            FLAGS[2] = 0;
        }
        FLAGS[3] = (~(operand1 ^ operand2)) & (operand1 ^ FLAGS[0]);
    };
    function BGE() {
        //Branch if Negative equal to Overflow
        return FLAGS[0] ^ FLAGS[3];
    };
    return {
        "setNegative":setNegative,
        "setNegativeFalse":setNegativeFalse,
        "getNegative":getNegative,
        "setZero":setZero,
        "setZeroTrue":setZeroTrue,
        "setZeroFalse":setZeroFalse,
        "getZero":getZero,
        "setOverflowTrue":setOverflowTrue,
        "setOverflowFalse":setOverflowFalse,
        "getOverflow":getOverflow,
        "setCarry":setCarry,
        "setCarryFalse":setCarryFalse,
        "getCarry":getCarry,
        "getCarryReverse":getCarryReverse,
        "checkConditionalCode":checkConditionalCode,
        "setNZInt":setNZInt,
        "setNZCV":setNZCV,
        "getNZCV":getNZCV,
        "setADDFlags":setADDFlags,
        "setADCFlags":setADCFlags,
        "setSUBFlags":setSUBFlags,
        "setSBCFlags":setSBCFlags,
        "setCMPFlags":setCMPFlags,
        "setCMNFlags":setCMNFlags,
        "BGE":BGE
    };
}