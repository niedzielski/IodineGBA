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
    this.channel3PCM = getInt8Array(0x40);
    this.WAVERAM = getUint8Array(0x20);
    this.audioTicks = 0;
    this.intializeWhiteNoise();
    this.initializeAudioStartState();
}
GameBoyAdvanceSound.prototype.initializeOutput = function (enabled, audioResamplerFirstPassFactor) {
    this.preprocessInitialization(enabled);
    this.audioIndex = 0;
    this.downsampleInputLeft = 0;
    this.downsampleInputRight = 0;
    this.audioResamplerFirstPassFactor = audioResamplerFirstPassFactor | 0;
}
GameBoyAdvanceSound.prototype.intializeWhiteNoise = function () {
    //Noise Sample Tables:
    var randomFactor = 1;
    //15-bit LSFR Cache Generation:
    this.LSFR15Table = getInt8Array(0x80000);
    var LSFR = 0x7FFF;    //Seed value has all its bits set.
    var LSFRShifted = 0x3FFF;
    for (var index = 0; index < 0x8000; ++index) {
        //Normalize the last LSFR value for usage:
        randomFactor = 1 - (LSFR & 1);    //Docs say it's the inverse.
        //Cache the different volume level results:
        this.LSFR15Table[0x08000 | index] = randomFactor;
        this.LSFR15Table[0x10000 | index] = randomFactor * 0x2;
        this.LSFR15Table[0x18000 | index] = randomFactor * 0x3;
        this.LSFR15Table[0x20000 | index] = randomFactor * 0x4;
        this.LSFR15Table[0x28000 | index] = randomFactor * 0x5;
        this.LSFR15Table[0x30000 | index] = randomFactor * 0x6;
        this.LSFR15Table[0x38000 | index] = randomFactor * 0x7;
        this.LSFR15Table[0x40000 | index] = randomFactor * 0x8;
        this.LSFR15Table[0x48000 | index] = randomFactor * 0x9;
        this.LSFR15Table[0x50000 | index] = randomFactor * 0xA;
        this.LSFR15Table[0x58000 | index] = randomFactor * 0xB;
        this.LSFR15Table[0x60000 | index] = randomFactor * 0xC;
        this.LSFR15Table[0x68000 | index] = randomFactor * 0xD;
        this.LSFR15Table[0x70000 | index] = randomFactor * 0xE;
        this.LSFR15Table[0x78000 | index] = randomFactor * 0xF;
        //Recompute the LSFR algorithm:
        LSFRShifted = LSFR >> 1;
        LSFR = LSFRShifted | (((LSFRShifted ^ LSFR) & 0x1) << 14);
    }
    //7-bit LSFR Cache Generation:
    this.LSFR7Table = getInt8Array(0x800);
    LSFR = 0x7F;    //Seed value has all its bits set.
    for (index = 0; index < 0x80; ++index) {
        //Normalize the last LSFR value for usage:
        randomFactor = 1 - (LSFR & 1);    //Docs say it's the inverse.
        //Cache the different volume level results:
        this.LSFR7Table[0x080 | index] = randomFactor;
        this.LSFR7Table[0x100 | index] = randomFactor * 0x2;
        this.LSFR7Table[0x180 | index] = randomFactor * 0x3;
        this.LSFR7Table[0x200 | index] = randomFactor * 0x4;
        this.LSFR7Table[0x280 | index] = randomFactor * 0x5;
        this.LSFR7Table[0x300 | index] = randomFactor * 0x6;
        this.LSFR7Table[0x380 | index] = randomFactor * 0x7;
        this.LSFR7Table[0x400 | index] = randomFactor * 0x8;
        this.LSFR7Table[0x480 | index] = randomFactor * 0x9;
        this.LSFR7Table[0x500 | index] = randomFactor * 0xA;
        this.LSFR7Table[0x580 | index] = randomFactor * 0xB;
        this.LSFR7Table[0x600 | index] = randomFactor * 0xC;
        this.LSFR7Table[0x680 | index] = randomFactor * 0xD;
        this.LSFR7Table[0x700 | index] = randomFactor * 0xE;
        this.LSFR7Table[0x780 | index] = randomFactor * 0xF;
        //Recompute the LSFR algorithm:
        LSFRShifted = LSFR >> 1;
        LSFR = LSFRShifted | (((LSFRShifted ^ LSFR) & 0x1) << 6);
    }
}
GameBoyAdvanceSound.prototype.initializeAudioStartState = function () {
    //NOTE: NR 60-63 never get reset in audio halting:
    this.nr60 = 0;
    this.nr61 = 0;
    this.nr62 = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0xFF;
    this.nr63 = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0x2;
    this.soundMasterEnabled = (!this.IOCore.BIOSFound || this.emulatorCore.SKIPBoot);
    this.mixerSoundBIAS = (this.IOCore.BIOSFound && !this.emulatorCore.SKIPBoot) ? 0 : 0x200;
    this.channel1currentSampleLeft = 0;
    this.channel1currentSampleLeftSecondary = 0;
    this.channel1currentSampleLeftTrimary = 0;
    this.channel2currentSampleLeft = 0;
    this.channel2currentSampleLeftSecondary = 0;
    this.channel2currentSampleLeftTrimary = 0;
    this.channel3currentSampleLeft = 0;
    this.channel3currentSampleLeftSecondary = 0;
    this.channel4currentSampleLeft = 0;
    this.channel4currentSampleLeftSecondary = 0;
    this.channel1currentSampleRight = 0;
    this.channel1currentSampleRightSecondary = 0;
    this.channel1currentSampleRightTrimary = 0;
    this.channel2currentSampleRight = 0;
    this.channel2currentSampleRightSecondary = 0;
    this.channel2currentSampleRightTrimary = 0;
    this.channel3currentSampleRight = 0;
    this.channel3currentSampleRightSecondary = 0;
    this.channel4currentSampleRight = 0;
    this.channel4currentSampleRightSecondary = 0;
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
    this.nr10 = 0;
    this.channel1SweepFault = false;
    this.channel1lastTimeSweep = 0;
    this.channel1timeSweep = 0;
    this.channel1frequencySweepDivider = 0;
    this.channel1decreaseSweep = false;
    //Clear NR11:
    this.nr11 = 0;
    this.channel1CachedDuty = this.dutyLookup[0];
    this.channel1totalLength = 0x40;
    //Clear NR12:
    this.nr12 = 0;
    this.channel1envelopeVolume = 0;
    //Clear NR13:
    this.channel1frequency = 0;
    this.channel1FrequencyTracker = 0x8000;
    //Clear NR14:
    this.nr14 = 0;
    this.channel1consecutive = true;
    this.channel1ShadowFrequency = 0x8000;
    this.channel1canPlay = false;
    this.channel1Enabled = false;
    this.channel1envelopeSweeps = 0;
    this.channel1envelopeSweepsLast = -1;
    //Clear NR21:
    this.nr21 = 0;
    this.channel2CachedDuty = this.dutyLookup[0];
    this.channel2totalLength = 0x40;
    //Clear NR22:
    this.nr22 = 0;
    this.channel2envelopeVolume = 0;
    //Clear NR23:
    this.nr23 = 0;
    this.channel2frequency = 0;
    this.channel2FrequencyTracker = 0x8000;
    //Clear NR24:
    this.nr24 = 0;
    this.channel2consecutive = true;
    this.channel2canPlay = false;
    this.channel2Enabled = false;
    this.channel2envelopeSweeps = 0;
    this.channel2envelopeSweepsLast = -1;
    //Clear NR30:
    this.nr30 = 0;
    this.channel3lastSampleLookup = 0;
    this.channel3canPlay = false;
    this.channel3WAVERAMBankSpecified = 0;
    this.channel3WAVERAMBankAccessed = 0x20;
    this.channel3WaveRAMBankSize = 0x1F;
    //Clear NR31:
    this.channel3totalLength = 0x100;
    //Clear NR32:
    this.nr32 = 0;
    this.channel3patternType = 4;
    //Clear NR33:
    this.nr33 = 0;
    this.channel3frequency = 0;
    this.channel3FrequencyPeriod = 0x4000;
    //Clear NR34:
    this.nr34 = 0;
    this.channel3consecutive = true;
    this.channel3Enabled = false;
    //Clear NR41:
    this.channel4totalLength = 0x40;
    //Clear NR42:
    this.nr42 = 0;
    this.channel4envelopeVolume = 0;
    //Clear NR43:
    this.nr43 = 0;
    this.channel4FrequencyPeriod = 32;
    this.channel4lastSampleLookup = 0;
    this.channel4BitRange =  0x7FFF;
    this.channel4VolumeShifter = 15;
    this.channel4currentVolume = 0;
    this.noiseSampleTable = this.LSFR15Table;
    //Clear NR44:
    this.nr44 = 0;
    this.channel4consecutive = true;
    this.channel4envelopeSweeps = 0;
    this.channel4envelopeSweepsLast = -1;
    this.channel4canPlay = false;
    this.channel4Enabled = false;
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
    this.channel1FrequencyCounter = 0;
    this.channel1DutyTracker = 0;
    this.channel2FrequencyCounter = 0;
    this.channel2DutyTracker = 0;
    this.channel3Counter = 0;
    this.channel4Counter = 0;
    this.PWMWidth = 0x200;
    this.PWMWidthOld = 0x200;
    this.PWMWidthShadow = 0x200;
    this.PWMBitDepthMask = 0x3FE;
    this.PWMBitDepthMaskShadow = 0x3FE;
    this.channel1OutputLevelCache();
    this.channel2OutputLevelCache();
    this.channel3UpdateCache();
    this.channel4UpdateCache();
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
    this.channel1OutputLevelCache();
    this.channel2OutputLevelCache();
    this.channel3UpdateCache();
    this.channel4UpdateCache();
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
            this.clockAudioSweep();
            break;
        case 4:
            this.clockAudioLength();
            break;
        case 6:
            this.clockAudioLength();
            this.clockAudioSweep();
            break;
        case 7:
            this.clockAudioEnvelope();
            this.sequencePosition = 0;
    }
}
GameBoyAdvanceSound.prototype.clockAudioLength = function () {
    //Channel 1:
    if ((this.channel1totalLength | 0) > 1) {
        this.channel1totalLength = ((this.channel1totalLength | 0) - 1) | 0;
    }
    else if ((this.channel1totalLength | 0) == 1) {
        this.channel1totalLength = 0;
        this.channel1EnableCheck();
        this.nr52 &= 0xFE;    //Channel #1 On Flag Off
    }
    //Channel 2:
    if ((this.channel2totalLength | 0) > 1) {
        this.channel2totalLength = ((this.channel2totalLength | 0) - 1) | 0;
    }
    else if ((this.channel2totalLength | 0) == 1) {
        this.channel2totalLength = 0;
        this.channel2EnableCheck();
        this.nr52 &= 0xFD;    //Channel #2 On Flag Off
    }
    //Channel 3:
    if ((this.channel3totalLength | 0) > 1) {
        this.channel3totalLength = ((this.channel3totalLength | 0) - 1) | 0;
    }
    else if ((this.channel3totalLength | 0) == 1) {
        this.channel3totalLength = 0;
        this.channel3EnableCheck();
        this.nr52 &= 0xFB;    //Channel #3 On Flag Off
    }
    //Channel 4:
    if ((this.channel4totalLength | 0) > 1) {
        this.channel4totalLength = ((this.channel4totalLength | 0) - 1) | 0;
    }
    else if ((this.channel4totalLength | 0) == 1) {
        this.channel4totalLength = 0;
        this.channel4EnableCheck();
        this.nr52 &= 0xF7;    //Channel #4 On Flag Off
    }
}
GameBoyAdvanceSound.prototype.clockAudioSweep = function () {
    //Channel 1:
    if (!this.channel1SweepFault && (this.channel1timeSweep | 0) > 0) {
        this.channel1timeSweep = ((this.channel1timeSweep | 0) - 1) | 0
        if ((this.channel1timeSweep | 0) == 0) {
            this.runAudioSweep();
        }
    }
}
GameBoyAdvanceSound.prototype.runAudioSweep = function () {
    //Channel 1:
    if ((this.channel1lastTimeSweep | 0) > 0) {
        if ((this.channel1frequencySweepDivider | 0) > 0) {
            this.channel1Swept = true;
            if (this.channel1decreaseSweep) {
                this.channel1ShadowFrequency = ((this.channel1ShadowFrequency | 0) - (this.channel1ShadowFrequency >> (this.channel1frequencySweepDivider | 0))) | 0;
                this.channel1frequency = this.channel1ShadowFrequency & 0x7FF;
                this.channel1FrequencyTracker = (0x800 - (this.channel1frequency | 0)) << 4;
            }
            else {
                this.channel1ShadowFrequency = ((this.channel1ShadowFrequency | 0) + (this.channel1ShadowFrequency >> (this.channel1frequencySweepDivider | 0))) | 0;
                this.channel1frequency = this.channel1ShadowFrequency | 0;
                if ((this.channel1ShadowFrequency | 0) <= 0x7FF) {
                    this.channel1FrequencyTracker = (0x800 - (this.channel1frequency | 0)) << 4;
                    //Run overflow check twice:
                    if ((((this.channel1ShadowFrequency | 0) + (this.channel1ShadowFrequency >> (this.channel1frequencySweepDivider | 0))) | 0) > 0x7FF) {
                        this.channel1SweepFault = true;
                        this.channel1EnableCheck();
                        this.nr52 &= 0xFE;    //Channel #1 On Flag Off
                    }
                }
                else {
                    this.channel1frequency &= 0x7FF;
                    this.channel1SweepFault = true;
                    this.channel1EnableCheck();
                    this.nr52 &= 0xFE;    //Channel #1 On Flag Off
                }
            }
            this.channel1timeSweep = this.channel1lastTimeSweep | 0;
        }
        else {
            //Channel has sweep disabled and timer becomes a length counter:
            this.channel1SweepFault = true;
            this.channel1EnableCheck();
        }
    }
}
GameBoyAdvanceSound.prototype.channel1AudioSweepPerformDummy = function () {
    //Channel 1:
    if ((this.channel1frequencySweepDivider | 0) > 0) {
        if (!this.channel1decreaseSweep) {
            var channel1ShadowFrequency = ((this.channel1ShadowFrequency | 0) + (this.channel1ShadowFrequency >> (this.channel1frequencySweepDivider | 0))) | 0;
            if ((channel1ShadowFrequency | 0) <= 0x7FF) {
                //Run overflow check twice:
                if ((((channel1ShadowFrequency | 0) + (channel1ShadowFrequency >> (this.channel1frequencySweepDivider | 0))) | 0) > 0x7FF) {
                    this.channel1SweepFault = true;
                    this.channel1EnableCheck();
                    this.nr52 &= 0xFE;    //Channel #1 On Flag Off
                }
            }
            else {
                this.channel1SweepFault = true;
                this.channel1EnableCheck();
                this.nr52 &= 0xFE;    //Channel #1 On Flag Off
            }
        }
    }
}
GameBoyAdvanceSound.prototype.clockAudioEnvelope = function () {
    //Channel 1:
    if ((this.channel1envelopeSweepsLast | 0) > -1) {
        if ((this.channel1envelopeSweeps | 0) > 0) {
            this.channel1envelopeSweeps = ((this.channel1envelopeSweeps | 0) - 1) | 0;
        }
        else {
            if (!this.channel1envelopeType) {
                if ((this.channel1envelopeVolume | 0) > 0) {
                    this.channel1envelopeVolume = ((this.channel1envelopeVolume | 0) - 1) | 0;
                    this.channel1envelopeSweeps = this.channel1envelopeSweepsLast | 0;
                }
                else {
                    this.channel1envelopeSweepsLast = -1;
                }
            }
            else if ((this.channel1envelopeVolume | 0) < 0xF) {
                this.channel1envelopeVolume = ((this.channel1envelopeVolume | 0) + 1) | 0;
                this.channel1envelopeSweeps = this.channel1envelopeSweepsLast | 0;
            }
            else {
                this.channel1envelopeSweepsLast = -1;
            }
        }
    }
    //Channel 2:
    if ((this.channel2envelopeSweepsLast | 0) > -1) {
        if ((this.channel2envelopeSweeps | 0) > 0) {
            this.channel2envelopeSweeps = ((this.channel2envelopeSweeps | 0) - 1) | 0;
        }
        else {
            if (!this.channel2envelopeType) {
                if ((this.channel2envelopeVolume | 0) > 0) {
                    this.channel2envelopeVolume = ((this.channel2envelopeVolume | 0) - 1) | 0;
                    this.channel2envelopeSweeps = this.channel2envelopeSweepsLast | 0;
                }
                else {
                    this.channel2envelopeSweepsLast = -1;
                }
            }
            else if ((this.channel2envelopeVolume | 0) < 0xF) {
                this.channel2envelopeVolume = ((this.channel2envelopeVolume | 0) + 1) | 0;
                this.channel2envelopeSweeps = this.channel2envelopeSweepsLast | 0;
            }
            else {
                this.channel2envelopeSweepsLast = -1;
            }
        }
    }
    //Channel 4:
    if ((this.channel4envelopeSweepsLast | 0) > -1) {
        if ((this.channel4envelopeSweeps | 0) > 0) {
            this.channel4envelopeSweeps = ((this.channel4envelopeSweeps | 0) - 1) | 0;
        }
        else {
            if (!this.channel4envelopeType) {
                if ((this.channel4envelopeVolume | 0) > 0) {
                    this.channel4envelopeVolume = ((this.channel4envelopeVolume | 0) - 1) | 0;
                    this.channel4currentVolume = (this.channel4envelopeVolume | 0) << (this.channel4VolumeShifter | 0);
                    this.channel4envelopeSweeps = this.channel4envelopeSweepsLast | 0;
                }
                else {
                    this.channel4envelopeSweepsLast = -1;
                }
            }
            else if ((this.channel4envelopeVolume | 0) < 0xF) {
                this.channel4envelopeVolume = ((this.channel4envelopeVolume | 0) + 1) | 0;
                this.channel4currentVolume = (this.channel4envelopeVolume | 0) << (this.channel4VolumeShifter | 0);
                this.channel4envelopeSweeps = this.channel4envelopeSweepsLast | 0;
            }
            else {
                this.channel4envelopeSweepsLast = -1;
            }
        }
    }
}
GameBoyAdvanceSound.prototype.computeAudioChannels = function () {
    //Clock down the four audio channels to the next closest audio event:
    this.channel1FrequencyCounter = ((this.channel1FrequencyCounter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel2FrequencyCounter = ((this.channel2FrequencyCounter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel3Counter = ((this.channel3Counter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    this.channel4Counter = ((this.channel4Counter | 0) - (this.audioClocksUntilNextEvent | 0)) | 0;
    //Channel 1 counter:
    if ((this.channel1FrequencyCounter | 0) == 0) {
        this.channel1FrequencyCounter = this.channel1FrequencyTracker | 0;
        this.channel1DutyTracker = ((this.channel1DutyTracker | 0) + 1) & 0x7;
    }
    //Channel 2 counter:
    if ((this.channel2FrequencyCounter | 0) == 0) {
        this.channel2FrequencyCounter = this.channel2FrequencyTracker | 0;
        this.channel2DutyTracker = ((this.channel2DutyTracker | 0) + 1) & 0x7;
    }
    //Channel 3 counter:
    if ((this.channel3Counter | 0) == 0) {
        if (this.channel3canPlay) {
            this.channel3lastSampleLookup = (((this.channel3lastSampleLookup | 0) + 1) & this.channel3WaveRAMBankSize) | this.channel3WAVERAMBankSpecified;
        }
        this.channel3Counter = this.channel3FrequencyPeriod | 0;
    }
    //Channel 4 counter:
    if ((this.channel4Counter | 0) == 0) {
        this.channel4lastSampleLookup = ((this.channel4lastSampleLookup | 0) + 1) & this.channel4BitRange;
        this.channel4Counter = this.channel4FrequencyPeriod | 0;
    }
    //Find the number of clocks to next closest counter event:
    this.audioClocksUntilNextEventCounter = this.audioClocksUntilNextEvent = Math.min(this.channel1FrequencyCounter | 0, this.channel2FrequencyCounter | 0, this.channel3Counter, this.channel4Counter | 0) | 0;
}
GameBoyAdvanceSound.prototype.channel1EnableCheck = function () {
    this.channel1Enabled = ((this.channel1consecutive || (this.channel1totalLength | 0) > 0) && !this.channel1SweepFault && this.channel1canPlay);
}
GameBoyAdvanceSound.prototype.channel1VolumeEnableCheck = function () {
    this.channel1canPlay = (this.nr12 > 7);
    this.channel1EnableCheck();
}
GameBoyAdvanceSound.prototype.channel1OutputLevelCache = function () {
    this.channel1currentSampleLeft = (this.leftChannel1) ? (this.channel1envelopeVolume | 0) : 0;
    this.channel1currentSampleRight = (this.rightChannel1) ? (this.channel1envelopeVolume | 0) : 0;
    this.channel1OutputLevelSecondaryCache();
}
GameBoyAdvanceSound.prototype.channel1OutputLevelSecondaryCache = function () {
    if (this.channel1Enabled) {
        this.channel1currentSampleLeftSecondary = this.channel1currentSampleLeft | 0;
        this.channel1currentSampleRightSecondary = this.channel1currentSampleRight | 0;
    }
    else {
        this.channel1currentSampleLeftSecondary = 0;
        this.channel1currentSampleRightSecondary = 0;
    }
    this.channel1OutputLevelTrimaryCache();
}
GameBoyAdvanceSound.prototype.channel1OutputLevelTrimaryCache = function () {
    if (this.channel1CachedDuty[this.channel1DutyTracker | 0]) {
        this.channel1currentSampleLeftTrimary = this.channel1currentSampleLeftSecondary | 0;
        this.channel1currentSampleRightTrimary = this.channel1currentSampleRightSecondary | 0;
    }
    else {
        this.channel1currentSampleLeftTrimary = 0;
        this.channel1currentSampleRightTrimary = 0;
    }
}
GameBoyAdvanceSound.prototype.channel2EnableCheck = function () {
    this.channel2Enabled = ((this.channel2consecutive || (this.channel2totalLength | 0) > 0) && this.channel2canPlay);
}
GameBoyAdvanceSound.prototype.channel2VolumeEnableCheck = function () {
    this.channel2canPlay = (this.nr22 > 7);
    this.channel2EnableCheck();
}
GameBoyAdvanceSound.prototype.channel2OutputLevelCache = function () {
    this.channel2currentSampleLeft = (this.leftChannel2) ? (this.channel2envelopeVolume | 0) : 0;
    this.channel2currentSampleRight = (this.rightChannel2) ? (this.channel2envelopeVolume | 0) : 0;
    this.channel2OutputLevelSecondaryCache();
}
GameBoyAdvanceSound.prototype.channel2OutputLevelSecondaryCache = function () {
    if (this.channel2Enabled) {
        this.channel2currentSampleLeftSecondary = this.channel2currentSampleLeft | 0;
        this.channel2currentSampleRightSecondary = this.channel2currentSampleRight | 0;
    }
    else {
        this.channel2currentSampleLeftSecondary = 0;
        this.channel2currentSampleRightSecondary = 0;
    }
    this.channel2OutputLevelTrimaryCache();
}
GameBoyAdvanceSound.prototype.channel2OutputLevelTrimaryCache = function () {
    if (this.channel2CachedDuty[this.channel2DutyTracker | 0]) {
        this.channel2currentSampleLeftTrimary = this.channel2currentSampleLeftSecondary | 0;
        this.channel2currentSampleRightTrimary = this.channel2currentSampleRightSecondary | 0;
    }
    else {
        this.channel2currentSampleLeftTrimary = 0;
        this.channel2currentSampleRightTrimary = 0;
    }
}
GameBoyAdvanceSound.prototype.channel3EnableCheck = function () {
    this.channel3Enabled = (/*this.channel3canPlay && */(this.channel3consecutive || (this.channel3totalLength | 0) > 0));
}
GameBoyAdvanceSound.prototype.channel3OutputLevelCache = function () {
    this.channel3currentSampleLeft = (this.leftChannel3) ? (this.cachedChannel3Sample | 0) : 0;
    this.channel3currentSampleRight = (this.rightChannel3) ? (this.cachedChannel3Sample | 0) : 0;
    this.channel3OutputLevelSecondaryCache();
}
GameBoyAdvanceSound.prototype.channel3OutputLevelSecondaryCache = function () {
    if (this.channel3Enabled) {
        this.channel3currentSampleLeftSecondary = this.channel3currentSampleLeft | 0;
        this.channel3currentSampleRightSecondary = this.channel3currentSampleRight | 0;
    }
    else {
        this.channel3currentSampleLeftSecondary = 0;
        this.channel3currentSampleRightSecondary = 0;
    }
}
GameBoyAdvanceSound.prototype.channel4EnableCheck = function () {
    this.channel4Enabled = ((this.channel4consecutive || (this.channel4totalLength | 0) > 0) && this.channel4canPlay);
}
GameBoyAdvanceSound.prototype.channel4VolumeEnableCheck = function () {
    this.channel4canPlay = ((this.nr42 | 0) > 7);
    this.channel4EnableCheck();
}
GameBoyAdvanceSound.prototype.channel4OutputLevelCache = function () {
    this.channel4currentSampleLeft = (this.leftChannel4) ? (this.cachedChannel4Sample | 0) : 0;
    this.channel4currentSampleRight = (this.rightChannel4) ? (this.cachedChannel4Sample | 0) : 0;
    this.channel4OutputLevelSecondaryCache();
}
GameBoyAdvanceSound.prototype.channel4OutputLevelSecondaryCache = function () {
    if (this.channel4Enabled) {
        this.channel4currentSampleLeftSecondary = this.channel4currentSampleLeft | 0;
        this.channel4currentSampleRightSecondary = this.channel4currentSampleRight | 0;
    }
    else {
        this.channel4currentSampleLeftSecondary = 0;
        this.channel4currentSampleRightSecondary = 0;
    }
}
GameBoyAdvanceSound.prototype.CGBMixerOutputLevelCache = function () {
    this.CGBMixerOutputCacheLeft = (((this.channel1currentSampleLeftTrimary | 0) + (this.channel2currentSampleLeftTrimary | 0) + (this.channel3currentSampleLeftSecondary | 0) + (this.channel4currentSampleLeftSecondary | 0)) * (this.VinLeftChannelMasterVolume | 0)) | 0;
    this.CGBMixerOutputCacheRight = (((this.channel1currentSampleRightTrimary | 0) + (this.channel2currentSampleRightTrimary | 0) + (this.channel3currentSampleRightSecondary | 0) + (this.channel4currentSampleRightSecondary | 0)) * (this.VinRightChannelMasterVolume | 0)) | 0;
    this.CGBFolder();
}
GameBoyAdvanceSound.prototype.channel3UpdateCache = function () {
    if ((this.channel3patternType | 0) != 3) {
        this.cachedChannel3Sample = this.channel3PCM[this.channel3lastSampleLookup | 0] >> (this.channel3patternType | 0);
    }
    else {
        this.cachedChannel3Sample = (this.channel3PCM[this.channel3lastSampleLookup | 0] * 0.75) | 0;
    }
    this.channel3OutputLevelCache();
}
GameBoyAdvanceSound.prototype.writeWAVE = function (address, data) {
    address = address | 0;
    data = data | 0;
    if (this.channel3canPlay) {
        this.audioJIT();
    }
    address = ((address | 0) + (this.channel3WAVERAMBankAccessed >> 1)) | 0;
    this.WAVERAM[address | 0] = data | 0;
    address <<= 1;
    this.channel3PCM[address | 0] = data >> 4;
    this.channel3PCM[address | 1] = data & 0xF;
}
GameBoyAdvanceSound.prototype.readWAVE = function (address) {
    address = ((address | 0) + (this.channel3WAVERAMBankAccessed >> 1)) | 0;
    return this.WAVERAM[address | 0] | 0;
}
GameBoyAdvanceSound.prototype.channel4UpdateCache = function () {
    this.cachedChannel4Sample = this.noiseSampleTable[this.channel4currentVolume | this.channel4lastSampleLookup] | 0;
    this.channel4OutputLevelCache();
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
    return 0x80 | this.nr10;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_L = function (data) {
    data = data | 0;
    //NR10:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel1decreaseSweep && (data & 0x08) == 0) {
            if (this.channel1Swept) {
                this.channel1SweepFault = true;
            }
        }
        this.channel1lastTimeSweep = (data & 0x70) >> 4;
        this.channel1frequencySweepDivider = data & 0x07;
        this.channel1decreaseSweep = ((data & 0x08) == 0x08);
        this.nr10 = data | 0;
        this.channel1EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_H0 = function () {
    //NR11:
    return 0x3F | this.nr11;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_H0 = function (data) {
    data = data | 0;
    //NR11:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1CachedDuty = this.dutyLookup[data >> 6];
        this.channel1totalLength = (0x40 - (data & 0x3F)) | 0;
        this.nr11 = data | 0;
        this.channel1EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_H1 = function () {
    //NR12:
    return this.nr12 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_H1 = function (data) {
    data = data | 0;
    //NR12:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel1Enabled && (this.channel1envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.nr12 ^ data) & 0x8) == 0x8) {
                if ((this.nr12 & 0x8) == 0) {
                    if ((this.nr12 & 0x7) == 0x7) {
                        this.channel1envelopeVolume = ((this.channel1envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel1envelopeVolume = ((this.channel1envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel1envelopeVolume = (16 - (this.channel1envelopeVolume | 0)) & 0xF;
            }
            else if ((this.nr12 & 0xF) == 0x8) {
                this.channel1envelopeVolume = (1 + (this.channel1envelopeVolume | 0)) & 0xF;
            }
        }
        this.channel1envelopeType = ((data & 0x08) == 0x08);
        this.nr12 = data | 0;
        this.channel1VolumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_X0 = function (data) {
    data = data | 0;
    //NR13:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1frequency = (this.channel1frequency & 0x700) | data;
        this.channel1FrequencyTracker = (0x800 - (this.channel1frequency | 0)) << 4;
    }
}
GameBoyAdvanceSound.prototype.readSOUND1CNT_X = function () {
    //NR14:
    return 0xBF | this.nr14;
}
GameBoyAdvanceSound.prototype.writeSOUND1CNT_X1 = function (data) {
    data = data | 0;
    //NR14:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel1consecutive = ((data & 0x40) == 0x0);
        this.channel1frequency = ((data & 0x7) << 8) | (this.channel1frequency & 0xFF);
        this.channel1FrequencyTracker = (0x800 - (this.channel1frequency | 0)) << 4;
        if (data > 0x7F) {
            //Reload nr10:
            this.channel1timeSweep = this.channel1lastTimeSweep | 0;
            this.channel1Swept = false;
            //Reload nr12:
            this.channel1envelopeVolume = this.nr12 >> 4;
            this.channel1envelopeSweepsLast = ((this.nr12 & 0x7) - 1) | 0;
            if ((this.channel1totalLength | 0) == 0) {
                this.channel1totalLength = 0x40;
            }
            if ((this.channel1lastTimeSweep | 0) > 0 || (this.channel1frequencySweepDivider | 0) > 0) {
                this.nr52 |= 0x1;
            }
            else {
                this.nr52 &= 0xFE;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x1;
            }
            this.channel1ShadowFrequency = this.channel1frequency | 0;
            //Reset frequency overflow check + frequency sweep type check:
            this.channel1SweepFault = false;
            //Supposed to run immediately:
            this.channel1AudioSweepPerformDummy();
        }
        this.channel1EnableCheck();
        this.nr14 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_L0 = function () {
    //NR21:
    return 0x3F | this.nr21;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_L0 = function (data) {
    data = data | 0;
    //NR21:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel2CachedDuty = this.dutyLookup[data >> 6];
        this.channel2totalLength = (0x40 - (data & 0x3F)) | 0;
        this.nr21 = data | 0;
        this.channel2EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_L1 = function () {
    //NR22:
    return this.nr22 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_L1 = function (data) {
    data = data | 0;
    //NR22:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel2Enabled && (this.channel2envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.nr22 ^ data) & 0x8) == 0x8) {
                if ((this.nr22 & 0x8) == 0) {
                    if ((this.nr22 & 0x7) == 0x7) {
                        this.channel2envelopeVolume = ((this.channel2envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel2envelopeVolume = ((this.channel2envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel2envelopeVolume = (16 - (this.channel2envelopeVolume | 0)) & 0xF;
            }
            else if ((this.nr12 & 0xF) == 0x8) {
                this.channel2envelopeVolume = (1 + (this.channel2envelopeVolume | 0)) & 0xF;
            }
        }
        this.channel2envelopeType = ((data & 0x08) == 0x08);
        this.nr22 = data | 0;
        this.channel2VolumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_H0 = function (data) {
    data = data | 0;
    //NR23:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel2frequency = (this.channel2frequency & 0x700) | data;
        this.channel2FrequencyTracker = (0x800 - (this.channel2frequency | 0)) << 4;
    }
}
GameBoyAdvanceSound.prototype.readSOUND2CNT_H = function () {
    //NR24:
    return 0xBF | this.nr24;
}
GameBoyAdvanceSound.prototype.writeSOUND2CNT_H1 = function (data) {
    data = data | 0;
    //NR24:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (data > 0x7F) {
            //Reload nr22:
            this.channel2envelopeVolume = this.nr22 >> 4;
            this.channel2envelopeSweepsLast = ((this.nr22 & 0x7) - 1) | 0;
            if ((this.channel2totalLength | 0) == 0) {
                this.channel2totalLength = 0x40;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x2;
            }
        }
        this.channel2consecutive = ((data & 0x40) == 0x0);
        this.channel2frequency = ((data & 0x7) << 8) | (this.channel2frequency & 0xFF);
        this.channel2FrequencyTracker = (0x800 - (this.channel2frequency | 0)) << 4;
        this.nr24 = data | 0;
        this.channel2EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_L = function () {
    //NR30:
    return 0x1F | this.nr30;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_L = function (data) {
    data = data | 0;
    //NR30:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (!this.channel3canPlay && (data | 0) >= 0x80) {
            this.channel3lastSampleLookup = 0;
        }
        this.channel3canPlay = (data > 0x7F);
        this.channel3WaveRAMBankSize = (data & 0x20) | 0x1F;
        this.channel3WAVERAMBankSpecified = ((data & 0x40) >> 1) ^ (data & 0x20);
        this.channel3WAVERAMBankAccessed = ((data & 0x40) >> 1) ^ 0x20;
        if (this.channel3canPlay && (this.nr30 | 0) > 0x7F && !this.channel3consecutive) {
            this.nr52 |= 0x4;
        }
        this.nr30 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_H0 = function (data) {
    data = data | 0;
    //NR31:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel3totalLength = (0x100 - (data | 0)) | 0;
        this.channel3EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_H = function () {
    //NR32:
    return 0x1F | this.nr32;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_H1 = function (data) {
    data = data | 0;
    //NR32:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        switch (data >> 5) {
            case 0:
                this.channel3patternType = 4;
                break;
            case 1:
                this.channel3patternType = 0;
                break;
            case 2:
                this.channel3patternType = 1;
                break;
            case 3:
                this.channel3patternType = 2;
                break;
            default:
                this.channel3patternType = 3;
        }
        this.nr32 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_X0 = function (data) {
    data = data | 0;
    //NR33:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel3frequency = (this.channel3frequency & 0x700) | data;
        this.channel3FrequencyPeriod = (0x800 - (this.channel3frequency | 0)) << 3;
    }
}
GameBoyAdvanceSound.prototype.readSOUND3CNT_X = function () {
    //NR34:
    return 0xBF | this.nr34;
}
GameBoyAdvanceSound.prototype.writeSOUND3CNT_X1 = function (data) {
    data = data | 0;
    //NR34:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if ((data | 0) > 0x7F) {
            if ((this.channel3totalLength | 0) == 0) {
                this.channel3totalLength = 0x100;
            }
            this.channel3lastSampleLookup = 0;
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x4;
            }
        }
        this.channel3consecutive = ((data & 0x40) == 0x0);
        this.channel3frequency = ((data & 0x7) << 8) | (this.channel3frequency & 0xFF);
        this.channel3FrequencyPeriod = (0x800 - (this.channel3frequency | 0)) << 3;
        this.channel3EnableCheck();
        this.nr34 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_L0 = function (data) {
    data = data | 0;
    //NR41:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel4totalLength = (0x40 - (data & 0x3F)) | 0;
        this.channel4EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_L1 = function (data) {
    data = data | 0;
    //NR42:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        if (this.channel4Enabled && (this.channel4envelopeSweeps | 0) == 0) {
            //Zombie Volume PAPU Bug:
            if (((this.nr42 ^ data) & 0x8) == 0x8) {
                if ((this.nr42 & 0x8) == 0) {
                    if ((this.nr42 & 0x7) == 0x7) {
                        this.channel4envelopeVolume = ((this.channel4envelopeVolume | 0) + 2) | 0;
                    }
                    else {
                        this.channel4envelopeVolume = ((this.channel4envelopeVolume | 0) + 1) | 0;
                    }
                }
                this.channel4envelopeVolume = (16 - (this.channel4envelopeVolume | 0)) & 0xF;
            }
            else if ((this.nr42 & 0xF) == 0x8) {
                this.channel4envelopeVolume = (1 + (this.channel4envelopeVolume | 0)) & 0xF;
            }
            this.channel4currentVolume = this.channel4envelopeVolume << (this.channel4VolumeShifter | 0);
        }
        this.channel4envelopeType = ((data & 0x08) == 0x08);
        this.nr42 = data | 0;
        this.channel4VolumeEnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_L = function () {
    //NR42:
    return this.nr42 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_H0 = function (data) {
    data = data | 0;
    //NR43:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.channel4FrequencyPeriod = Math.max((data & 0x7) << 4, 8) << (((data >> 4) + 2) | 0);
        var bitWidth = data & 0x8;
        if (((bitWidth | 0) == 0x8 && (this.channel4BitRange | 0) == 0x7FFF) || ((bitWidth | 0) == 0 && (this.channel4BitRange | 0) == 0x7F)) {
            this.channel4lastSampleLookup = 0;
            this.channel4BitRange = ((bitWidth | 0) == 0x8) ? 0x7F : 0x7FFF;
            this.channel4VolumeShifter = ((bitWidth | 0) == 0x8) ? 7 : 15;
            this.channel4currentVolume = this.channel4envelopeVolume << (this.channel4VolumeShifter | 0);
            this.noiseSampleTable = ((bitWidth | 0) == 0x8) ? this.LSFR7Table : this.LSFR15Table;
        }
        this.nr43 = data | 0;
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_H0 = function () {
    //NR43:
    return this.nr43 | 0;
}
GameBoyAdvanceSound.prototype.writeSOUND4CNT_H1 = function (data) {
    data = data | 0;
    //NR44:
    if (this.soundMasterEnabled) {
        this.audioJIT();
        this.nr44 = data | 0;
        this.channel4consecutive = ((data & 0x40) == 0x0);
        if ((data | 0) > 0x7F) {
            this.channel4envelopeVolume = this.nr42 >> 4;
            this.channel4currentVolume = this.channel4envelopeVolume << (this.channel4VolumeShifter | 0);
            this.channel4envelopeSweepsLast = ((this.nr42 & 0x7) - 1) | 0;
            if ((this.channel4totalLength | 0) == 0) {
                this.channel4totalLength = 0x40;
            }
            if ((data & 0x40) == 0x40) {
                this.nr52 |= 0x8;
            }
        }
        this.channel4EnableCheck();
    }
}
GameBoyAdvanceSound.prototype.readSOUND4CNT_H1 = function () {
    //NR44:
    return 0xBF | this.nr44;
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
    this.PWMBitDepthMask = (this.PWMWidthShadow - 1) << (1 + ((data & 0xC0) >> 6)); 
    this.nr63 = data | 0;
}
GameBoyAdvanceSound.prototype.readSOUNDBIAS1 = function () {
    //NR63:
    return 0x2C | this.nr63;
}