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
function GameBoyAdvanceSound(IOCore) {
    //Build references:
    this.IOCore = IOCore;
    this.emulatorCore = this.IOCore.emulatorCore;
    this.initializePAPU();
}
GameBoyAdvanceSound.prototype.dutyLookup = [
    [false, false, false, false, false, false, false, true],
    [true, false, false, false, false, false, false, true],
    [true, false, false, false, false, true, true, true],
    [false, true, true, true, true, true, true, false]
];
GameBoyAdvanceSound.prototype.initializePAPU = function () {
    //Did the emulator core initialize us for output yet?
    this.preprocessInitialization(false);
    //Initialize start:
    this.audioTicks = 0;
    this.initializeAudioStartState();
}
GameBoyAdvanceSound.prototype.initializeOutput = function (enabled, audioResamplerFirstPassFactor) {
    this.preprocessInitialization(enabled);
    this.audioIndex = 0;
    this.downsampleInputLeft = 0;
    this.downsampleInputRight = 0;
    this.audioResamplerFirstPassFactor = audioResamplerFirstPassFactor | 0;
}
GameBoyAdvanceSound.prototype.initializeAudioStartState = function () {
    //NOTE: NR 60-63 never get reset in audio halting:
    this.nr60 = 0;
    this.nr61 = 0;
    this.nr62 = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0xFF;
    this.nr63 = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0x2;
    this.soundMasterEnabled = (!this.IOCore.BIOSFound || this.emulatorCore.SKIPBoot);
    this.mixerSoundBIAS = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0x200;
    this.channel1 = new GameBoyAdvanceChannel1AttributeTable(this);
    this.channel2 = new GameBoyAdvanceChannel2AttributeTable(this);
    this.channel3 = new GameBoyAdvanceChannel3AttributeTable(this);
    this.channel4 = new GameBoyAdvanceChannel4AttributeTable(this);
    this.CGBMixerOutputCacheLeft = 0;
    this.CGBMixerOutputCacheLeftFolded = 0;
    this.CGBMixerOutputCacheRight = 0;
    this.CGBMixerOutputCacheRightFolded = 0;
    this.AGBDirectSoundATimer = 0;
    this.AGBDirectSoundBTimer = 0;
    this.AGBDirectSoundA = 0;
    this.AGBDirectSoundAFolded = 0;
    this.AGBDirectSoundB = 0;
    this.AGBDirectSoundBFolded = 0;
    this.AGBDirectSoundAShifter = 0;
    this.AGBDirectSoundBShifter = 0;
    this.AGBDirectSoundALeftCanPlay = false;
    this.AGBDirectSoundBLeftCanPlay = false;
    this.AGBDirectSoundARightCanPlay = false;
    this.AGBDirectSoundBRightCanPlay = false;
    this.CGBOutputRatio = 2;
    this.FIFOABuffer = new GameBoyAdvanceFIFO();
    this.FIFOBBuffer = new GameBoyAdvanceFIFO();
    this.AGBDirectSoundAFIFOClear();
    this.AGBDirectSoundBFIFOClear();
    this.audioDisabled();       //Clear legacy PAPU registers:
}
GameBoyAdvanceSound.prototype.audioDisabled = function () {
    //Clear NR10:
    this.channel1.nr10 = 0;
    this.channel1.SweepFault = false;
    this.channel1.lastTimeSweep = 0;
    this.channel1.timeSweep = 0;
    this.channel1.frequencySweepDivider = 0;
    this.channel1.decreaseSweep = false;
    //Clear NR11:
    this.channel1.nr11 = 0;
    this.channel1.CachedDuty = this.dutyLookup[0];
    this.channel1.totalLength = 0x40;
    //Clear NR12:
    this.channel1.nr12 = 0;
    this.channel1.envelopeVolume = 0;
    //Clear NR13:
    this.channel1.frequency = 0;
    this.channel1.FrequencyTracker = 0x8000;
    //Clear NR14:
    this.channel1.nr14 = 0;
    this.channel1.consecutive = true;
    this.channel1.ShadowFrequency = 0x8000;
    this.channel1.canPlay = false;
    this.channel1.Enabled = false;
    this.channel1.envelopeSweeps = 0;
    this.channel1.envelopeSweepsLast = -1;
    //Clear NR21:
    this.channel2.nr21 = 0;
    this.channel2.CachedDuty = this.dutyLookup[0];
    this.channel2.totalLength = 0x40;
    //Clear NR22:
    this.channel2.nr22 = 0;
    this.channel2.envelopeVolume = 0;
    //Clear NR23:
    this.channel2.nr23 = 0;
    this.channel2.frequency = 0;
    this.channel2.FrequencyTracker = 0x8000;
    //Clear NR24:
    this.channel2.nr24 = 0;
    this.channel2.consecutive = true;
    this.channel2.canPlay = false;
    this.channel2.Enabled = false;
    this.channel2.envelopeSweeps = 0;
    this.channel2.envelopeSweepsLast = -1;
    //Clear NR30:
    this.channel3.nr30 = 0;
    this.channel3.lastSampleLookup = 0;
    this.channel3.canPlay = false;
    this.channel3.WAVERAMBankSpecified = 0;
    this.channel3.WAVERAMBankAccessed = 0x20;
    this.channel3.WaveRAMBankSize = 0x1F;
    //Clear NR31:
    this.channel3.totalLength = 0x100;
    //Clear NR32:
    this.channel3.nr32 = 0;
    this.channel3.patternType = 4;
    //Clear NR33:
    this.channel3.nr33 = 0;
    this.channel3.frequency = 0;
    this.channel3.FrequencyPeriod = 0x4000;
    //Clear NR34:
    this.channel3.nr34 = 0;
    this.channel3.consecutive = true;
    this.channel3.Enabled = false;
    //Clear NR41:
    this.channel4.totalLength = 0x40;
    //Clear NR42:
    this.channel4.nr42 = 0;
    this.channel4.envelopeVolume = 0;
    //Clear NR43:
    this.channel4.nr43 = 0;
    this.channel4.FrequencyPeriod = 32;
    this.channel4.lastSampleLookup = 0;
    this.channel4.BitRange =  0x7FFF;
    this.channel4.VolumeShifter = 15;
    this.channel4.currentVolume = 0;
    this.channel4.noiseSampleTable = this.channel4.LSFR15Table;
    //Clear NR44:
    this.channel4.nr44 = 0;
    this.channel4.consecutive = true;
    this.channel4.envelopeSweeps = 0;
    this.channel4.envelopeSweepsLast = -1;
    this.channel4.canPlay = false;
    this.channel4.Enabled = false;
    //Clear NR50:
    this.nr50 = 0;
    this.VinLeftChannelMasterVolume = 1;
    this.VinRightChannelMasterVolume = 1;
    //Clear NR51:
    this.nr51 = 0;
    this.rightChannel1 = false;
    this.rightChannel2 = false;
    this.rightChannel3 = false;
    this.rightChannel4 = false;
    this.leftChannel1 = false;
    this.leftChannel2 = false;
    this.leftChannel3 = false;
    this.leftChannel4 = false;
    //Clear NR52:
    this.nr52 = 0;
    this.soundMasterEnabled = false;
    this.mixerOutputCacheLeft = this.mixerSoundBIAS | 0;
    this.mixerOutputCacheRight = this.mixerSoundBIAS | 0;
    this.audioClocksUntilNextEventCounter = 0;
    this.audioClocksUntilNextEvent = 0;
    this.sequencePosition = 0;
    this.sequencerClocks = 0x8000;
    this.channel1.FrequencyCounter = 0;
    this.channel1.DutyTracker = 0;
    this.channel2.FrequencyCounter = 0;
    this.channel2.DutyTracker = 0;
    this.channel3.counter = 0;
    this.channel4.counter = 0;
    this.PWMWidth = 0x200;
    this.PWMWidthOld = 0x200;
    this.PWMWidthShadow = 0x200;
    this.PWMBitDepthMask = 0x3FE;
    this.PWMBitDepthMaskShadow = 0x3FE;
    this.channel1.outputLevelCache();
    this.channel2.outputLevelCache();
    this.channel3.updateCache();
    this.channel4.updateCache();
}
GameBoyAdvanceSound.prototype.audioEnabled = function () {
    //Set NR52:
    this.nr52 = 0x80;
    this.soundMasterEnabled = true;
}
GameBoyAdvanceSound.prototype.addClocks = function (clocks) {
    clocks = clocks | 0;
    this.audioTicks = ((this.audioTicks | 0) + (clocks | 0)) | 0;
}
GameBoyAdvanceSound.prototype.generateAudioSlow = function (numSamples) {
    var multiplier = 0;
    if (this.soundMasterEnabled && this.IOCore.systemStatus < 4) {
        for (var clockUpTo = 0; numSamples > 0;) {
            clockUpTo = Math.min(this.PWMWidth, numSamples);
            this.PWMWidth = this.PWMWidth - clockUpTo;
            numSamples -= clockUpTo;
            while (clockUpTo > 0) {
                multiplier = Math.min(clockUpTo, this.audioResamplerFirstPassFactor - this.audioIndex);
                clockUpTo -= multiplier;
                this.audioIndex += multiplier;
                this.downsampleInputLeft += this.mixerOutputCacheLeft * multiplier;
                this.downsampleInputRight += this.mixerOutputCacheRight * multiplier;
                if (this.audioIndex == this.audioResamplerFirstPassFactor) {
                    this.audioIndex = 0;
                    this.emulatorCore.outputAudio(this.downsampleInputLeft, this.downsampleInputRight);
                    this.downsampleInputLeft = 0;
                    this.downsampleInputRight = 0;
                }
            }
            if (this.PWMWidth == 0) {
                this.computeNextPWMInterval();
                this.PWMWidthOld = this.PWMWidthShadow;
                this.PWMWidth = this.PWMWidthShadow;
            }
        }
    }
    else {
        //SILENT OUTPUT:
        while (numSamples > 0) {
            multiplier = Math.min(numSamples, this.audioResamplerFirstPassFactor - this.audioIndex);
            numSamples -= multiplier;
            this.audioIndex += multiplier;
            if (this.audioIndex == this.audioResamplerFirstPassFactor) {
                this.audioIndex = 0;
                this.emulatorCore.outputAudio(this.downsampleInputLeft, this.downsampleInputRight);
                this.downsampleInputLeft = 0;
                this.downsampleInputRight = 0;
            }
        }
    }
}
GameBoyAdvanceSound.prototype.generateAudioOptimized = function (numSamples) {
    numSamples = numSamples | 0;
    var multiplier = 0;
    if (this.soundMasterEnabled && (this.IOCore.systemStatus | 0) < 4) {
        for (var clockUpTo = 0; (numSamples | 0) > 0;) {
            clockUpTo = Math.min(this.PWMWidth | 0, numSamples | 0) | 0;
            this.PWMWidth = ((this.PWMWidth | 0) - (clockUpTo | 0)) | 0;
            numSamples = ((numSamples | 0) - (clockUpTo | 0)) | 0;
            while ((clockUpTo | 0) > 0) {
                multiplier = Math.min(clockUpTo | 0, ((this.audioResamplerFirstPassFactor | 0) - (this.audioIndex | 0)) | 0) | 0;
                clockUpTo = ((clockUpTo | 0) - (multiplier | 0)) | 0;
                this.audioIndex = ((this.audioIndex | 0) + (multiplier | 0)) | 0;
                this.downsampleInputLeft = ((this.downsampleInputLeft | 0) + Math.imul(this.mixerOutputCacheLeft | 0, multiplier | 0)) | 0;
                this.downsampleInputRight = ((this.downsampleInputRight | 0) + Math.imul(this.mixerOutputCacheRight | 0, multiplier | 0)) | 0;
                if ((this.audioIndex | 0) == (this.audioResamplerFirstPassFactor | 0)) {
                    this.audioIndex = 0;
                    this.emulatorCore.outputAudio(this.downsampleInputLeft | 0, this.downsampleInputRight | 0);
                    this.downsampleInputLeft = 0;
                    this.downsampleInputRight = 0;
                }
            }
            if ((this.PWMWidth | 0) == 0) {
                this.computeNextPWMInterval();
                this.PWMWidthOld = this.PWMWidthShadow | 0;
                this.PWMWidth = this.PWMWidthShadow | 0;
            }
        }
    }
    else {
        //SILENT OUTPUT:
        while ((numSamples | 0) > 0) {
            multiplier = Math.min(numSamples | 0, ((this.audioResamplerFirstPassFactor | 0) - (this.audioIndex | 0)) | 0) | 0;
            numSamples = ((numSamples | 0) - (multiplier | 0)) | 0;
            this.audioIndex = ((this.audioIndex | 0) + (multiplier | 0)) | 0;
            if ((this.audioIndex | 0) == (this.audioResamplerFirstPassFactor | 0)) {
                this.audioIndex = 0;
                this.emulatorCore.outputAudio(this.downsampleInputLeft | 0, this.downsampleInputRight | 0);
                this.downsampleInputLeft = 0;
                this.downsampleInputRight = 0;
            }
        }
    }
}
//Generate audio, but don't actually output it (Used for when sound is disabled by user/browser):
GameBoyAdvanceSound.prototype.generateAudioFake = function (numSamples) {
    numSamples = numSamples | 0;
    if (this.soundMasterEnabled && this.IOCore.systemStatus < 4) {
        for (var clockUpTo = 0; (numSamples | 0) > 0;) {
            clockUpTo = Math.min(this.PWMWidth | 0, numSamples | 0) | 0;
            this.PWMWidth = ((this.PWMWidth | 0) - (clockUpTo | 0)) | 0;
            numSamples = ((numSamples | 0) - (clockUpTo | 0)) | 0;
            if ((this.PWMWidth | 0) == 0) {
                this.computeNextPWMInterval();
                this.PWMWidthOld = this.PWMWidthShadow | 0;
                this.PWMWidth = this.PWMWidthShadow | 0;
            }
        }
    }
}
GameBoyAdvanceSound.prototype.preprocessInitialization = function (audioInitialized) {
    if (audioInitialized) {
        this.generateAudio = (!!Math.imul) ? this.generateAudioOptimized : this.generateAudioSlow;
        this.audioInitialized = true;
    }
    else {
        this.generateAudio = this.generateAudioFake;
        this.audioInitialized = false;
    }
}
GameBoyAdvanceSound.prototype.audioJIT = function () {
    //Audio Sample Generation Timing:
    this.generateAudio(this.audioTicks | 0);
    this.audioTicks = 0;
}
GameBoyAdvanceSound.prototype.computeNextPWMInterval = function () {
    //Clock down the PSG system:
    for (var numSamples = this.PWMWidthOld | 0, clockUpTo = 0; (numSamples | 0) > 0; numSamples = ((numSamples | 0) - 1) | 0) {
        clockUpTo = Math.min(this.audioClocksUntilNextEventCounter | 0, this.sequencerClocks | 0, numSamples | 0) | 0;
        this.audioClocksUntilNextEventCounter = ((this.audioClocksUntilNextEventCounter | 0) - (clockUpTo | 0)) | 0;
        this.sequencerClocks = ((this.sequencerClocks | 0) - (clockUpTo | 0)) | 0;
        numSamples = ((numSamples | 0) - (clockUpTo | 0)) | 0;
        if ((this.sequencerClocks | 0) == 0) {
            this.audioComputeSequencer();
            this.sequencerClocks = 0x8000;
        }
        if ((this.audioClocksUntilNextEventCounter | 0) == 0) {
            this.computeAudioChannels();
        }
    }
    //Copy the new bit-depth mask for the next counter interval:
    this.PWMBitDepthMask = this.PWMBitDepthMaskShadow | 0;
    //Compute next sample for the PWM output:
    this.channel1.outputLevelCache();
    this.channel2.outputLevelCache();
    this.channel3.updateCache();
    this.channel4.updateCache();
    this.CGBMixerOutputLevelCache();
    this.mixerOutputLevelCache();
}
GameBoyAdvanceSound.prototype.audioComputeSequencer = function () {
    switch (this.sequencePosition++) {
        case 0:
            this.clockAudioLength();
            break;
        case 2:
            this.clockAudioLength();
            this.channel1.clockAudioSweep();
            break;
        case 4:
            this.clockAudioLength();
            break;
        case 6:
            this.clockAudioLength();
            this.channel1.clockAudioSweep();
            break;
        case 7:
            this.clockAudioEnvelope();
            this.sequencePosition = 0;
    }
}
GameBoyAdvanceSound.prototype.clockAudioLength = function () {
    //Channel 1:
    this.channel1.clockAudioLength();
    //Channel 2:
    this.channel2.clockAudioLength();
    //Channel 3:
    this.channel3.clockAudioLength();
    //Channel 4:
    this.channel4.clockAudioLength();
}
GameBoyAdvanceSound.prototype.clockAudioEnvelope = function () {
    //Channel 1:
    this.channel1.clockAudioEnvelope();
    //Channel 2:
    this.channel2.clockAudioEnvelope();
    //Channel 4:
    this.channel4.clockAudioEnvelope();
}
GameBoyAdvanceSound.prototype.computeAudioChannels = function () {
    //Clock down the four audio channels to the next closest audio event:
    this.channel1.FrequencyCounter = ((this.channel1.FrequencyCounter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel2.FrequencyCounter = ((this.channel2.FrequencyCounter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel3.counter = ((this.channel3.counter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel4.counter = ((this.channel4.counter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    //Channel 1 counter:
    this.channel1.computeAudioChannel();
    //Channel 2 counter:
    this.channel2.computeAudioChannel();
    //Channel 3 counter:
    this.channel3.computeAudioChannel();
    //Channel 4 counter:
    this.channel4.computeAudioChannel();
    //Find the number of clocks to next closest counter event:
    this.audioClocksUntilNextEventCounter = this.audioClocksUntilNextEvent = Math.min(this.channel1.FrequencyCounter | 0, this.channel2.FrequencyCounter | 0, this.channel3.counter, this.channel4.counter | 0) | 0;
}
GameBoyAdvanceSound.prototype.CGBMixerOutputLevelCache = function () {
    this.CGBMixerOutputCacheLeft = (((this.channel1.currentSampleLeftTrimary | 0) + (this.channel2.currentSampleLeftTrimary | 0) + (this.channel3.currentSampleLeftSecondary | 0) + (this.channel4.currentSampleLeftSecondary | 0)) * (this.VinLeftChannelMasterVolume | 0)) | 0;
    this.CGBMixerOutputCacheRight = (((this.channel1.currentSampleRightTrimary | 0) + (this.channel2.currentSampleRightTrimary | 0) + (this.channel3.currentSampleRightSecondary | 0) + (this.channel4.currentSampleRightSecondary | 0)) * (this.VinRightChannelMasterVolume | 0)) | 0;
    this.CGBFolder();
}
GameBoyAdvanceSound.prototype.writeWAVE = function (address, data) {
    address = address | 0;
    data = data | 0;
    this.channel3.writeWAVE(address | 0, data | 0);
}
GameBoyAdvanceSound.prototype.readWAVE = function (address) {
    return this.channel3.readWAVE(address | 0) | 0;
}
GameBoyAdvanceSound.prototype.writeFIFOA = function (data) {
    data = data | 0;
    this.FIFOABuffer.push(data | 0);
    this.checkFIFOAPendingSignal();
}
GameBoyAdvanceSound.prototype.writeFIFOB = function (data) {
    data = data | 0;
    this.FIFOBBuffer.push(data | 0);
    this.checkFIFOBPendingSignal();
}
GameBoyAdvanceSound.prototype.checkFIFOAPendingSignal = function () {
    if (this.FIFOABuffer.requestingDMA()) {
        this.IOCore.dma.soundFIFOARequest();
    }
}
GameBoyAdvanceSound.prototype.checkFIFOBPendingSignal = function () {
    if (this.FIFOBBuffer.requestingDMA()) {
        this.IOCore.dma.soundFIFOBRequest();
    }
}
GameBoyAdvanceSound.prototype.AGBDirectSoundAFIFOClear = function () {
    this.FIFOABuffer.count = 0;
    this.AGBDirectSoundATimerIncrement();
}
GameBoyAdvanceSound.prototype.AGBDirectSoundBFIFOClear = function () {
    this.FIFOBBuffer.count = 0;
    this.AGBDirectSoundBTimerIncrement();
}
GameBoyAdvanceSound.prototype.AGBDirectSoundTimer0ClockTick = function () {
    this.audioJIT();
    if ((this.AGBDirectSoundATimer | 0) == 0) {
        this.AGBDirectSoundATimerIncrement();
    }
    if ((this.AGBDirectSoundBTimer | 0) == 0) {
        this.AGBDirectSoundBTimerIncrement();
    }
}
GameBoyAdvanceSound.prototype.AGBDirectSoundTimer1ClockTick = function () {
    this.audioJIT();
    if ((this.AGBDirectSoundATimer | 0) == 1) {
        this.AGBDirectSoundATimerIncrement();
    }
    if ((this.AGBDirectSoundBTimer | 0) == 1) {
        this.AGBDirectSoundBTimerIncrement();
    }
}
GameBoyAdvanceSound.prototype.nextFIFOAEventTime = function () {
    var nextEventTime = 0;
    if (!this.FIFOABuffer.requestingDMA()) {
        var samplesUntilDMA = this.FIFOABuffer.samplesUntilDMATrigger() | 0;
        if ((this.AGBDirectSoundATimer | 0) == 0) {
            nextEventTime = this.IOCore.timer.nextTimer0Overflow(samplesUntilDMA | 0);
        }
        else {
            nextEventTime = this.IOCore.timer.nextTimer1Overflow(samplesUntilDMA | 0);
        }
    }
    return Math.min(nextEventTime, 0x7FFFFFFF) | 0;
}
GameBoyAdvanceSound.prototype.nextFIFOBEventTime = function () {
    var nextEventTime = 0;
    if (!this.FIFOBBuffer.requestingDMA()) {
        var samplesUntilDMA = this.FIFOBBuffer.samplesUntilDMATrigger() | 0;
        if ((this.AGBDirectSoundBTimer | 0) == 0) {
            nextEventTime = this.IOCore.timer.nextTimer0Overflow(samplesUntilDMA | 0);
        }
        else {
            nextEventTime = this.IOCore.timer.nextTimer1Overflow(samplesUntilDMA | 0);
        }
    }
    return Math.min(nextEventTime, 0x7FFFFFFF) | 0;
}
GameBoyAdvanceSound.prototype.AGBDirectSoundATimerIncrement = function () {
    this.AGBDirectSoundA = this.FIFOABuffer.shift() | 0;
    this.checkFIFOAPendingSignal();
    this.AGBFIFOAFolder();
}
GameBoyAdvanceSound.prototype.AGBDirectSoundBTimerIncrement = function () {
    this.AGBDirectSoundB = this.FIFOBBuffer.shift() | 0;
    this.checkFIFOBPendingSignal();
    this.AGBFIFOBFolder();
}
GameBoyAdvanceSound.prototype.AGBFIFOAFolder = function () {
    this.AGBDirectSoundAFolded = this.AGBDirectSoundA >> (this.AGBDirectSoundAShifter | 0);
}
GameBoyAdvanceSound.prototype.AGBFIFOBFolder = function () {
    this.AGBDirectSoundBFolded = this.AGBDirectSoundB >> (this.AGBDirectSoundBShifter | 0);
}
GameBoyAdvanceSound.prototype.CGBFolder = function () {
    this.CGBMixerOutputCacheLeftFolded = (this.CGBMixerOutputCacheLeft << (this.CGBOutputRatio | 0)) >> 1;
    this.CGBMixerOutputCacheRightFolded = (this.CGBMixerOutputCacheRight << (this.CGBOutputRatio | 0)) >> 1;
}
GameBoyAdvanceSound.prototype.mixerOutputLevelCache = function () {
    this.mixerOutputCacheLeft = Math.min(Math.max((((this.AGBDirectSoundALeftCanPlay) ? (this.AGBDirectSoundAFolded | 0) : 0) +
    ((this.AGBDirectSoundBLeftCanPlay) ? (this.AGBDirectSoundBFolded | 0) : 0) +
    (this.CGBMixerOutputCacheLeftFolded | 0) + (this.mixerSoundBIAS | 0)) | 0, 0) | 0, 0x3FF) & this.PWMBitDepthMask;
    this.mixerOutputCacheRight = Math.min(Math.max((((this.AGBDirectSoundARightCanPlay) ? (this.AGBDirectSoundAFolded | 0) : 0) +
    ((this.AGBDirectSoundBRightCanPlay) ? (this.AGBDirectSoundBFolded | 0) : 0) +
    (this.CGBMixerOutputCacheRightFolded | 0) + (this.mixerSoundBIAS | 0)) | 0, 0) | 0, 0x3FF) & this.PWMBitDepthMask;
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_L = function () {
    //NR10:
    return 0x80 | this.channel1.nr10;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_L = function (data) {
    data = data | 0;
    //NR10:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel1.decreaseSweep && (data & 0x08) == 0) {
            if (this.channel1.Swept) {
                this.channel1.SweepFault = true;
            }
        }
        this.channel1.lastTimeSweep = (data & 0x70) >> 4;
        this.channel1.frequencySweepDivider = data & 0x07;
        this.channel1.decreaseSweep = ((data & 0x08) == 0x08);
        this.channel1.nr10 = data | 0;
        this.channel1.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_H0 = function () {
    //NR11:
    return 0x3F | this.channel1.nr11;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_H0 = function (data) {
    data = data | 0;
    //NR11:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1.CachedDuty = this.dutyLookup[data >> 6];
        this.channel1.totalLength = (0x40 - (data & 0x3F)) | 0;
        this.channel1.nr11 = data | 0;
        this.channel1.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_H1 = function () {
    //NR12:
    return this.channel1.nr12 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_H1 = function (data) {
    data = data | 0;
    //NR12:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel1.Enabled && (this.channel1.envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.channel1.nr12 ^ data) & 0x8) == 0x8) {
                if ((this.channel1.nr12 & 0x8) == 0) {
                    if ((this.channel1.nr12 & 0x7) == 0x7) {
                        this.channel1.envelopeVolume = ((this.channel1.envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel1.envelopeVolume = ((this.channel1.envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel1.envelopeVolume = (16 - (this.channel1.envelopeVolume | 0)) & 0xF;
            }
            else if ((this.channel1.nr12 & 0xF) == 0x8) {
                this.channel1.envelopeVolume = (1 + (this.channel1.envelopeVolume | 0)) & 0xF;
            }
        }
        this.channel1.envelopeType = ((data & 0x08) == 0x08);
        this.channel1.nr12 = data | 0;
        this.channel1.volumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_X0 = function (data) {
    data = data | 0;
    //NR13:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1.frequency = (this.channel1.frequency & 0x700) | data;
        this.channel1.FrequencyTracker = (0x800 - (this.channel1.frequency | 0)) << 4;
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_X = function () {
    //NR14:
    return 0xBF | this.channel1.nr14;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_X1 = function (data) {
    data = data | 0;
    //NR14:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1.consecutive = ((data & 0x40) == 0x0);
        this.channel1.frequency = ((data & 0x7) << 8) | (this.channel1.frequency & 0xFF);
        this.channel1.FrequencyTracker = (0x800 - (this.channel1.frequency | 0)) << 4;
        if (data > 0x7F) {
            //Reload nr10:
            this.channel1.timeSweep = this.channel1.lastTimeSweep | 0;
            this.channel1.Swept = false;
            //Reload nr12:
            this.channel1.envelopeVolume = this.channel1.nr12 >> 4;
            this.channel1.envelopeSweepsLast = ((this.channel1.nr12 & 0x7) - 1) | 0;
            if ((this.channel1.totalLength | 0) == 0) {
                this.channel1.totalLength = 0x40;
            }
            if ((this.channel1.lastTimeSweep | 0) > 0 || (this.channel1.frequencySweepDivider | 0) > 0) {
                this.nr52 |= 0x1;
            }
            else {
                this.nr52 &= 0xFE;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x1;
            }
            this.channel1.ShadowFrequency = this.channel1.frequency | 0;
            //Reset frequency overflow check + frequency sweep type check:
            this.channel1.SweepFault = false;
            //Supposed to run immediately:
            this.channel1.audioSweepPerformDummy();
        }
        this.channel1.enableCheck();
        this.channel1.nr14 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_L0 = function () {
    //NR21:
    return 0x3F | this.channel2.nr21;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_L0 = function (data) {
    data = data | 0;
    //NR21:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel2.CachedDuty = this.dutyLookup[data >> 6];
        this.channel2.totalLength = (0x40 - (data & 0x3F)) | 0;
        this.channel2.nr21 = data | 0;
        this.channel2.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_L1 = function () {
    //NR22:
    return this.channel2.nr22 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_L1 = function (data) {
    data = data | 0;
    //NR22:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel2.Enabled && (this.channel2.envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.channel2.nr22 ^ data) & 0x8) == 0x8) {
                if ((this.channel2.nr22 & 0x8) == 0) {
                    if ((this.channel2.nr22 & 0x7) == 0x7) {
                        this.channel2.envelopeVolume = ((this.channel2.envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel2.envelopeVolume = ((this.channel2.envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel2.envelopeVolume = (16 - (this.channel2.envelopeVolume | 0)) & 0xF;
            }
            else if ((this.channel2.nr22 & 0xF) == 0x8) {
                this.channel2.envelopeVolume = (1 + (this.channel2.envelopeVolume | 0)) & 0xF;
            }
        }
        this.channel2.envelopeType = ((data & 0x08) == 0x08);
        this.channel2.nr22 = data | 0;
        this.channel2.volumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_H0 = function (data) {
    data = data | 0;
    //NR23:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel2.frequency = (this.channel2.frequency & 0x700) | data;
        this.channel2.FrequencyTracker = (0x800 - (this.channel2.frequency | 0)) << 4;
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_H = function () {
    //NR24:
    return 0xBF | this.channel2.nr24;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_H1 = function (data) {
    data = data | 0;
    //NR24:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (data > 0x7F) {
            //Reload nr22:
            this.channel2.envelopeVolume = this.channel2.nr22 >> 4;
            this.channel2.envelopeSweepsLast = ((this.channel2.nr22 & 0x7) - 1) | 0;
            if ((this.channel2.totalLength | 0) == 0) {
                this.channel2.totalLength = 0x40;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x2;
            }
        }
        this.channel2.consecutive = ((data & 0x40) == 0x0);
        this.channel2.frequency = ((data & 0x7) << 8) | (this.channel2.frequency & 0xFF);
        this.channel2.FrequencyTracker = (0x800 - (this.channel2.frequency | 0)) << 4;
        this.channel2.nr24 = data | 0;
        this.channel2.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_L = function () {
    //NR30:
    return this.channel3.readSOUND3CNT_L() | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_L = function (data) {
    //NR30:
    data = data | 0;
    this.channel3.writeSOUND3CNT_L(data | 0);
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_H0 = function (data) {
    //NR31:
    data = data | 0;
    this.channel3.writeSOUND3CNT_H0(data | 0);
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_H = function () {
    //NR32:
    return this.channel3.readSOUND3CNT_H() | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_H1 = function (data) {
    //NR32:
    data = data | 0;
    this.channel3.writeSOUND3CNT_H1(data | 0);
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_X0 = function (data) {
    //NR33:
    data = data | 0;
    this.channel3.writeSOUND3CNT_X0(data | 0);
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_X = function () {
    //NR34:
    return this.channel3.readSOUND3CNT_X() | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_X1 = function (data) {
    //NR34:
    data = data | 0;
    this.channel3.writeSOUND3CNT_X1(data | 0);
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_L0 = function (data) {
    data = data | 0;
    //NR41:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel4.totalLength = (0x40 - (data & 0x3F)) | 0;
        this.channel4.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_L1 = function (data) {
    data = data | 0;
    //NR42:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel4.Enabled && (this.channel4.envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.channel4.nr42 ^ data) & 0x8) == 0x8) {
                if ((this.channel4.nr42 & 0x8) == 0) {
                    if ((this.channel4.nr42 & 0x7) == 0x7) {
                        this.channel4.envelopeVolume = ((this.channel4.envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel4.envelopeVolume = ((this.channel4.envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel4.envelopeVolume = (16 - (this.channel4.envelopeVolume | 0)) & 0xF;
            }
            else if ((this.channel4.nr42 & 0xF) == 0x8) {
                this.channel4.envelopeVolume = (1 + (this.channel4.envelopeVolume | 0)) & 0xF;
            }
            this.channel4.currentVolume = this.channel4.envelopeVolume << (this.channel4.VolumeShifter | 0);
        }
        this.channel4.envelopeType = ((data & 0x08) == 0x08);
        this.channel4.nr42 = data | 0;
        this.channel4.volumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_L = function () {
    //NR42:
    return this.channel4.nr42 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_H0 = function (data) {
    data = data | 0;
    //NR43:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel4.FrequencyPeriod = Math.max((data & 0x7) << 4, 8) << (((data >> 4) + 2) | 0);
        var bitWidth = data & 0x8;
        if (((bitWidth | 0) == 0x8 && (this.channel4.BitRange | 0) == 0x7FFF) || ((bitWidth | 0) == 0 && (this.channel4.BitRange | 0) == 0x7F)) {
            this.channel4.lastSampleLookup = 0;
            this.channel4.BitRange = ((bitWidth | 0) == 0x8) ? 0x7F : 0x7FFF;
            this.channel4.VolumeShifter = ((bitWidth | 0) == 0x8) ? 7 : 15;
            this.channel4.currentVolume = this.channel4.envelopeVolume << (this.channel4.VolumeShifter | 0);
            this.channel4.noiseSampleTable = ((bitWidth | 0) == 0x8) ? this.channel4.LSFR7Table : this.channel4.LSFR15Table;
        }
        this.channel4.nr43 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_H0 = function () {
    //NR43:
    return this.channel4.nr43 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_H1 = function (data) {
    data = data | 0;
    //NR44:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel4.nr44 = data | 0;
        this.channel4.consecutive = ((data & 0x40) == 0x0);
        if ((data | 0) > 0x7F) {
            this.channel4.envelopeVolume = this.channel4.nr42 >> 4;
            this.channel4.currentVolume = this.channel4.envelopeVolume << (this.channel4.VolumeShifter | 0);
            this.channel4.envelopeSweepsLast = ((this.channel4.nr42 & 0x7) - 1) | 0;
            if ((this.channel4.totalLength | 0) == 0) {
                this.channel4.totalLength = 0x40;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x8;
            }
        }
        this.channel4.enableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_H1 = function () {
    //NR44:
    return 0xBF | this.channel4.nr44;
}
GameBoyAdvanceSound.prototype.writeSOUNDCNT_L0 = function (data) {
    data = data | 0;
    //NR50:
    if (this.soundMasterEnabled && (this.nr50 | 0) != (data | 0)) {
        this.audioJIT();
        this.nr50 = data | 0;
        this.VinLeftChannelMasterVolume = (((data >> 4) & 0x07) + 1) | 0;
        this.VinRightChannelMasterVolume = ((data & 0x07) + 1) | 0;
    }
}
GameBoyAdvanceSound.prototype.readSOUNDCNT_L0 = function () {
    //NR50:
    return 0x88 | this.nr50;
}
GameBoyAdvanceSound.prototype.writeSOUNDCNT_L1 = function (data) {
    data = data | 0;
    //NR51:
    if (this.soundMasterEnabled && (this.nr51 | 0) != (data | 0)) {
        this.audioJIT();
        this.nr51 = data | 0;
        this.rightChannel1 = ((data & 0x01) == 0x01);
        this.rightChannel2 = ((data & 0x02) == 0x02);
        this.rightChannel3 = ((data & 0x04) == 0x04);
        this.rightChannel4 = ((data & 0x08) == 0x08);
        this.leftChannel1 = ((data & 0x10) == 0x10);
        this.leftChannel2 = ((data & 0x20) == 0x20);
        this.leftChannel3 = ((data & 0x40) == 0x40);
        this.leftChannel4 = (data > 0x7F);
    }
}
GameBoyAdvanceSound.prototype.readSOUNDCNT_L1 = function () {
    //NR51:
    return this.nr51 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUNDCNT_H0 = function (data) {
    data = data | 0;
    //NR60:
    this.audioJIT();
    this.CGBOutputRatio = data & 0x3;
    this.AGBDirectSoundAShifter = (data & 0x04) >> 2;
    this.AGBDirectSoundBShifter = (data & 0x08) >> 3;
    this.nr60 = data | 0;
}
GameBoyAdvanceSound.prototype.readSOUNDCNT_H0 = function () {
    //NR60:
    return 0xF0 | this.nr60;
}
GameBoyAdvanceSound.prototype.writeSOUNDCNT_H1 = function (data) {
    data = data | 0;
    //NR61:
    this.audioJIT();
    this.AGBDirectSoundARightCanPlay = ((data & 0x1) == 0x1);
    this.AGBDirectSoundALeftCanPlay = ((data & 0x2) == 0x2);
    this.AGBDirectSoundATimer = (data & 0x4) >> 2;
    if ((data & 0x08) == 0x08) {
        this.AGBDirectSoundAFIFOClear();
    }
    this.AGBDirectSoundBRightCanPlay = ((data & 0x10) == 0x10);
    this.AGBDirectSoundBLeftCanPlay = ((data & 0x20) == 0x20);
    this.AGBDirectSoundBTimer = (data & 0x40) >> 6;
    if ((data & 0x80) == 0x80) {
        this.AGBDirectSoundBFIFOClear();
    }
    this.nr61 = data | 0;
}
GameBoyAdvanceSound.prototype.readSOUNDCNT_H1 = function () {
    //NR61:
    return this.nr61 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUNDCNT_X = function (data) {
    data = data | 0;
    //NR52:
    if (!this.soundMasterEnabled && (data | 0) > 0x7F) {
        this.audioJIT();
        this.audioEnabled();
    }
    else if (this.soundMasterEnabled && (data | 0) < 0x80) {
        this.audioJIT();
        this.audioDisabled();
    }
}
GameBoyAdvanceSound.prototype.readSOUNDCNT_X = function () {
    //NR52:
    return 0x70 | this.nr52;
}
GameBoyAdvanceSound.prototype.writeSOUNDBIAS0 = function (data) {
    data = data | 0;
    //NR62:
    this.audioJIT();
    this.mixerSoundBIAS &= 0x300;
    this.mixerSoundBIAS |= (data | 0);
    this.nr62 = data | 0;
}
GameBoyAdvanceSound.prototype.readSOUNDBIAS0 = function () {
    //NR62:
    return this.nr62 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUNDBIAS1 = function (data) {
    data = data | 0;
    //NR63:
    this.audioJIT();
    this.mixerSoundBIAS &= 0xFF;
    this.mixerSoundBIAS |= (data & 0x3) << 8;
    this.PWMWidthShadow = 0x200 >> ((data & 0xC0) >> 6);
    this.PWMBitDepthMaskShadow = (this.PWMWidthShadow - 1) << (1 + ((data & 0xC0) >> 6)); 
    this.nr63 = data | 0;
}
GameBoyAdvanceSound.prototype.readSOUNDBIAS1 = function () {
    //NR63:
    return 0x2C | this.nr63;
}