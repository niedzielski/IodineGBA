(function () {
    var files = [
        "includes/TypedArrayShim.js",
        "IodineGBA/GameBoyAdvanceCartridgeCore.js",
        "IodineGBA/GameBoyAdvanceDMACore.js",
        "IodineGBA/GameBoyAdvanceEmulatorCore.js",
        "IodineGBA/GameBoyAdvanceGraphicsCore.js",
        "IodineGBA/GameBoyAdvanceIOCore.js",
        "IodineGBA/GameBoyAdvanceMemoryCore.js",
        "IodineGBA/GameBoyAdvanceIRQCore.js",
        "IodineGBA/GameBoyAdvanceJoyPadCore.js",
        "IodineGBA/GameBoyAdvanceSerialCore.js",
        "IodineGBA/GameBoyAdvanceSoundCore.js",
        "IodineGBA/GameBoyAdvanceTimerCore.js",
        "IodineGBA/GameBoyAdvanceWaitCore.js",
        "IodineGBA/GameBoyAdvanceCPUCore.js",
        "IodineGBA/GameBoyAdvanceSavesCore.js",
        "IodineGBA/sound/GameBoyAdvanceFIFOCore.js",
        "IodineGBA/sound/GameBoyAdvanceChannel1Synth.js",
        "IodineGBA/sound/GameBoyAdvanceChannel2Synth.js",
        "IodineGBA/sound/GameBoyAdvanceChannel3Synth.js",
        "IodineGBA/sound/GameBoyAdvanceChannel4Synth.js",
        "IodineGBA/CPU/ARMInstructionSetCore.js",
        "IodineGBA/CPU/THUMBInstructionSetCore.js",
        "IodineGBA/CPU/ARMCPSRAttributeTable.js",
        "IodineGBA/CPU/GameBoyAdvanceSWICore.js",
        "IodineGBA/graphics/GameBoyAdvanceBGTEXTRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceBG2FrameBufferRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceBGMatrixRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceAffineBGRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceColorEffectsRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceMode0RendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceMode1RendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceMode2RendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceModeFrameBufferRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceMosaicRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceOAMAttributeTable.js",
        "IodineGBA/graphics/GameBoyAdvanceOBJRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceOBJWindowRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceWindowRendererCore.js",
        "IodineGBA/graphics/GameBoyAdvanceCompositorCore.js",
        "IodineGBA/memory/GameBoyAdvanceMemoryDispatchGeneratorCore.js",
        "IodineGBA/memory/GameBoyAdvanceDMA0Core.js",
        "IodineGBA/memory/GameBoyAdvanceDMA1Core.js",
        "IodineGBA/memory/GameBoyAdvanceDMA2Core.js",
        "IodineGBA/memory/GameBoyAdvanceDMA3Core.js",
        "IodineGBA/cartridge/GameBoyAdvanceSaveDeterminerCore.js",
        "IodineGBA/cartridge/GameBoyAdvanceSRAMChipCore.js",
        "IodineGBA/cartridge/GameBoyAdvanceFLASHChipCore.js",
        "IodineGBA/cartridge/GameBoyAdvanceEEPROMChipCore.js"
    ];
    
    var appendPoint = document.getElementById('loader');
    
    for (var i = 0; i < files.length; i++) {
        var script = document.createElement('script');
        script.src = 'IodineGBA/' + files[i];
        script.async = false;
        
        appendPoint.parentNode.insertBefore(script, appendPoint.nextSibling);
        appendPoint = script;
    }
}());