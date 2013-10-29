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
var emuSpeed = 1;
var emuVolume = 1;
var Iodine = null;
window.onload = function () {
    //Initialize Iodine:
    Iodine = new GameBoyAdvanceEmulator();
    Iodine.attachCanvas(document.getElementById("emulator_target"));
    Iodine.attachSAVEHandler(SaveToStorage);
    //Hook the GUI controls.
    registerGUIEvents();
}
function registerGUIEvents() {
    addEvent("keydown", document, keyDown);
    addEvent("keyup", document, keyUpPreprocess);
    addEvent("change", document.getElementById("rom_load"), fileLoadROM);
    addEvent("change", document.getElementById("bios_load"), fileLoadBIOS);
    addEvent("click", document.getElementById("play"), function (event) {
        Iodine.play();
        this.style.display = "none";
        document.getElementById("pause").style.display = "inline";
        event.preventDefault();
    });
    addEvent("click", document.getElementById("pause"), function (event) {
        Iodine.pause();
        this.style.display = "none";
        document.getElementById("play").style.display = "inline";
        event.preventDefault();
    });
    addEvent("click", document.getElementById("restart"), function (event) {
        Iodine.restart();
        ImportSave();
        event.preventDefault();
    });
    document.getElementById("sound").checked = false;
    addEvent("click", document.getElementById("sound"), function () {
        if (this.checked) {
            Iodine.enableAudio();
        }
        else {
            Iodine.disableAudio();
        }
    });
    document.getElementById("skip_boot").checked = false;
    addEvent("click", document.getElementById("skip_boot"), function () {
             Iodine.toggleSkipBootROM(this.checked);
             ImportSave();
    });
    document.getElementById("lle_jit").checked = false;
    addEvent("click", document.getElementById("lle_jit"), function () {
             Iodine.toggleDynarec(this.checked);
    });
    document.getElementById("lineskip").checked = false;
    addEvent("click", document.getElementById("lineskip"), function () {
             Iodine.toggleLineSkip(this.checked);
    });
    document.getElementById("toggleSlowDownBusHack").checked = false;
    addEvent("click", document.getElementById("toggleSlowDownBusHack"), function () {
             Iodine.toggleSlowDownBusHack(this.checked);
    });
    addEvent("unload", document, ExportSave);
    setInterval(
            function () {
                if (!Iodine.paused) {
                    var speed = document.getElementById("speed");
                    speed.textContent = "Speed: " + Iodine.getSpeedPercentage();
                }
                Iodine.resetMetrics();
            }
    ,500);
}
function resetPlayButton() {
    document.getElementById("pause").style.display = "none";
    document.getElementById("play").style.display = "inline";
}
function lowerVolume() {
    emuVolume = Math.max(emuVolume - 0.04, 0);
    Iodine.changeVolume(emuVolume);
}
function raiseVolume() {
    emuVolume = Math.min(emuVolume + 0.04, 1);
    Iodine.changeVolume(emuVolume);
}
//Some wrappers and extensions for non-DOM3 browsers:
function addEvent(sEvent, oElement, fListener) {
    try {    
        oElement.addEventListener(sEvent, fListener, false);
    }
    catch (error) {
        oElement.attachEvent("on" + sEvent, fListener);    //Pity for IE.
    }
}
function removeEvent(sEvent, oElement, fListener) {
    try {    
        oElement.removeEventListener(sEvent, fListener, false);
    }
    catch (error) {
        oElement.detachEvent("on" + sEvent, fListener);    //Pity for IE.
    }
}