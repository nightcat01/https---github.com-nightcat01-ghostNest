# Asset Generator Setup

This guide explains how the `asset-generator` extension starts and connects to ComfyUI.

## Runtime Model

The extension has two separate parts.

1. GhostNest Asset Generator
   - Included in this project.
   - Provides `dev-assets.html`.
   - Provides the same-origin bridge API under the GhostNest dev server.

2. ComfyUI
   - Not bundled with GhostNest.
   - Must exist on the developer machine.
   - Must be started separately by the developer.

GhostNest does not ship ComfyUI binaries or models. They are too large and environment-specific.

## Enable Extension

Configure `ghost-nest.extensions.json`.

```json
{
  "extensions": {
    "asset-generator": {
      "enabled": true,
      "devServer": {
        "bridge": true,
        "comfyUiUrl": "http://127.0.0.1:8188",
        "workflowPath": "src/devtools/layer-part-workflow.api.json"
      }
    }
  }
}
```

Rules:

- `enabled: true` makes the extension available.
- `bridge: true` enables the GhostNest API bridge.
- `comfyUiUrl` points to a separately running ComfyUI server.

## Start ComfyUI Separately

Start ComfyUI in its own terminal before using Generate.

Windows portable example:

```powershell
E:\tools\ComfyUI_windows_portable\run_nvidia_gpu.bat
```

Python install example:

```powershell
python E:\tools\ComfyUI\main.py --listen 127.0.0.1 --port 8188
```

GhostNest only connects to the configured `comfyUiUrl`. It does not start or install ComfyUI.

## Workflow File

The default workflow mode is server file path. The bridge expects a ComfyUI API workflow JSON at:

```txt
src/devtools/layer-part-workflow.api.json
```

You can change this path with:

```json
"workflowPath": "your/path/workflow.api.json"
```

Prefer a path relative to the GhostNest project root. The server resolves it internally before reading the file.

When server file mode is used, GhostNest checks workflow files in this order:

1. `workflowPath` from `ghost-nest.extensions.json` or `COMFYUI_WORKFLOW_PATH`
2. Default fallback: `src/devtools/layer-part-workflow.api.json`
3. Built package fallback: `dist/devtools/layer-part-workflow.api.json`

The first existing file is used.

## Workflow Source Modes

The Asset Generator page supports three workflow source modes.

1. Server file path
   - Default mode.
   - Uses `workflowPath` from `ghost-nest.extensions.json`.
   - Best for normal local asset production.

2. Upload workflow JSON
   - Select a ComfyUI API workflow JSON in the page.
   - Useful for testing another workflow without changing project config.

3. Fetch workflow URL
   - Enter a URL that returns workflow JSON.
   - Useful for temporary local or remote workflow sharing.

The selected mode is sent to the GhostNest bridge with each generation request.

The workflow can use these placeholders:

```txt
{{input_image}}
{{mask_image}}
{{reference_image}}
{{prompt}}
{{mask_prompt}}
{{reference_prompt}}
{{negative_prompt}}
{{filename_prefix}}
{{recipe_id}}
{{character_id}}
{{target_region}}
{{target_region_x}}
{{target_region_y}}
{{target_region_width}}
{{target_region_height}}
```

`{{reference_image}}` is optional. It is populated only when the page includes a reference image; otherwise workflows can ignore it.
Use it in a second `LoadImage` node when a custom IP-Adapter, ControlNet, pose, or expression-reference workflow needs comparison guidance.

`{{mask_image}}` is generated from the selected crop. White areas indicate the region an inpaint workflow should redraw,
and black areas indicate the surrounding crop pixels that should be preserved.

`{{target_region}}` and the split target-region placeholders describe the selected part area in percentage coordinates.
They are intended for crop, mask, inpaint, and transparent layer-part workflows.

When a target region is selected, the Asset Generator creates a cropped PNG in the browser and sends it as
`croppedBaseImageDataUrl`. The bridge uploads that crop to ComfyUI as `{{input_image}}`, so the default workflow edits
the selected part area instead of the full base image.

After ComfyUI returns generated crop images, the page keeps the crop as a cover overlay and feathers the edges.
The downloaded or saved result is therefore a transparent PNG layer part that can cover the original eye or mouth area
instead of only drawing the changed pixels on top of the base.

GhostNest also applies common values automatically for typical ComfyUI nodes:

- `LoadImage.inputs.image`
- `SaveImage.inputs.filename_prefix`
- `KSampler.inputs.seed`

## Startup Log

GhostNest prints the configured bridge target when it starts.

```txt
GhostNest Asset Generator bridge enabled: true
GhostNest ComfyUI bridge target: http://127.0.0.1:8188
GhostNest ComfyUI workflow path: ...
```
