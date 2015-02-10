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
    var negative = 0;          //N Bit
    var zero = 1;              //Z Bit
    var overflow = 0;          //V Bit
    var carry = 0;             //C Bit
    function setNegative(toSet) {
        negative = toSet | 0;
    };
    function setNegativeFalse() {
        negative = 0;
    };
    function getNegative() {
        return negative | 0;
    };
    function setZero(toSet) {
        zero = toSet | 0;
    };
    function setZeroTrue() {
        zero = 0;
    };
    function setZeroFalse() {
        zero = 1;
    };
    function getZero() {
        return zero | 0;
    };
    function setOverflow(toSet) {
        overflow = toSet | 0;
    };
    function setOverflowTrue() {
        overflow = 0x10000000;
    };
    function setOverflowFalse() {
        overflow = 0;
    };
    function getOverflow() {
        return overflow | 0;
    };
    function setCarry(toSet) {
        carry = (toSet >>> 3) | 0;
    };
    function setCarryFalse() {
        carry = 0;
    };
    function getCarry() {
        return carry | 0;
    };
    function getCarryReverse() {
        return carry ^ 0x10000000;
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
            case 0x0:
                if (zero == 0) {
                    execute = 0;
                    break;
                }
                execute = 0x10000000;
                break;
            case 0x1:
                execute = carry ^ 0x10000000;
                break;
            case 0x2:
                execute = (~negative >>> 31) << 28;
                break;
            case 0x3:
                execute = overflow ^ 0x10000000;
                break;
            case 0x6:
                if (zero == 0) {
                    execute = 0x10000000;
                    break;
                }
            case 0x5:
                execute = ((negative >>> 31) << 28) ^ overflow;
                break;
            case 0x4:
                if (carry == 0 || zero == 0) {
                    execute = 0x10000000;
                    break;
                }
            default:
                execute = 0;
        }
        return execute | 0;
    };
    function setNZInt(toSet) {
        toSet = toSet | 0;
        negative = toSet | 0;
        zero = toSet | 0;
    };
    function setADDFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        negative = ((operand1 | 0) + (operand2 | 0)) | 0;
        zero = negative | 0;
        carry = ((negative >>> 0) < (operand1 >>> 0)) ? 0x10000000 : 0;
        overflow = (((~(operand1 ^ operand2)) & (operand1 ^ negative)) >> 3) & 0x10000000;
        return negative | 0;
    };
    function setADCFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        //We let this get outside of int32 on purpose:
        var unsignedResult = (operand1 >>> 0) + (operand2 >>> 0) + (carry >> 28);
        carry = (unsignedResult > 0xFFFFFFFF) ? 0x10000000 : 0;
        zero = unsignedResult | 0;
        negative = zero | 0;
        overflow = (((~(operand1 ^ operand2)) & (operand1 ^ zero)) >> 3) & 0x10000000;
        return zero | 0;
    };
    function setSUBFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        zero = (operand1 - operand2) | 0;
        negative = zero | 0;
        overflow = (((operand1 ^ operand2) & (operand1 ^ zero)) >> 3) & 0x10000000;
        carry = ((operand1 >>> 0) >= (operand2 >>> 0)) ? 0x10000000 : 0;
        return zero | 0;
    };
    function setSBCFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        //We let this get outside of int32 on purpose:
        var unsignedResult = (operand1 >>> 0) - (operand2 >>> 0) - (1 ^ (carry >> 28));
        carry = (unsignedResult >= 0) ? 0x10000000 : 0;
        zero = unsignedResult | 0;
        negative = zero | 0;
        overflow = (((operand1 ^ operand2) & (operand1 ^ zero)) >> 3) & 0x10000000;
        return zero | 0;
    };
    function setCMPFlags(operand1, operand2) {
        //Update flags for a subtraction operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        zero = (operand1 - operand2) | 0;
        negative = zero | 0;
        overflow = (((operand1 ^ operand2) & (operand1 ^ zero)) >> 3) & 0x10000000;
        carry = ((operand1 >>> 0) >= (operand2 >>> 0)) ? 0x10000000 : 0;
    };
    function setCMNFlags(operand1, operand2) {
        //Update flags for an addition operation:
        operand1 = operand1 | 0;
        operand2 = operand2 | 0;
        negative = ((operand1 | 0) + (operand2 | 0)) | 0;
        zero = negative | 0;
        carry = ((negative >>> 0) < (operand1 >>> 0)) ? 0x10000000 : 0;
        overflow = (((~(operand1 ^ operand2)) & (operand1 ^ negative)) >> 3) & 0x10000000;
    };
    function BGE() {
        //Branch if Negative equal to Overflow
        return (negative >>> 3) ^ overflow;
    };
    return {
        "setNegative":setNegative,
        "setNegativeFalse":setNegativeFalse,
        "getNegative":getNegative,
        "setZero":setZero,
        "setZeroTrue":setZeroTrue,
        "setZeroFalse":setZeroFalse,
        "getZero":getZero,
        "setOverflow":setOverflow,
        "setOverflowTrue":setOverflowTrue,
        "setOverflowFalse":setOverflowFalse,
        "getOverflow":getOverflow,
        "setCarry":setCarry,
        "setCarryFalse":setCarryFalse,
        "getCarry":getCarry,
        "getCarryReverse":getCarryReverse,
        "checkConditionalCode":checkConditionalCode,
        "setNZInt":setNZInt,
        "setADDFlags":setADDFlags,
        "setADCFlags":setADCFlags,
        "setSUBFlags":setSUBFlags,
        "setSBCFlags":setSBCFlags,
        "setCMPFlags":setCMPFlags,
        "setCMNFlags":setCMNFlags,
        "BGE":BGE
    };
}