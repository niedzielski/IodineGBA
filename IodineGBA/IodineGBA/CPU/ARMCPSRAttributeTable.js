"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
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
    var negative = false;        //N Bit
    var zero = false;            //Z Bit
    var overflow = false;        //V Bit
    var carry = false;           //C Bit
    function setNegative(toSet) {
        negative = !!toSet;
    };
    function setNegativeFalse() {
        negative = false;
    };
    function getNegative() {
        return negative;
    };
    function getNegativeAnti() {
        return !negative;
    };
    function setZero(toSet) {
        zero = !!toSet;
    };
    function setZeroTrue() {
        zero = true;
    };
    function getZero() {
        return zero;
    };
    function getZeroAnti() {
        return !zero;
    };
    function setOverflow(toSet) {
        overflow = !!toSet;
    };
    function getOverflow() {
        return overflow;
    };
    function getOverflowAnti() {
        return overflow;
    };
    function setCarry(toSet) {
        carry = !!toSet;
    };
    function setCarryFalse() {
        carry = false;
    };
    function getCarry() {
        return carry;
    };
    function getCarryAnti() {
        return !carry;
    };
    return {
        "setNegative":setNegative,
        "setNegativeFalse":setNegativeFalse,
        "getNegative":getNegative,
        "getNegativeAnti":getNegativeAnti,
        "setZero":setZero,
        "setZeroTrue":setZeroTrue,
        "getZero":getZero,
        "getZeroAnti":getZeroAnti,
        "setOverflow":setOverflow,
        "getOverflow":getOverflow,
        "getOverflowAnti":getOverflowAnti,
        "setCarry":setCarry,
        "setCarryFalse":setCarryFalse,
        "getCarry":getCarry,
        "getCarryAnti":getCarryAnti
    };
}