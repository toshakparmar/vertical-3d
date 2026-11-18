# GLB Model Audit Report

Generated: 2026-11-18T13:02:34.296Z

## Summary of Audited Files

| File Name | Size (MB) | Meshes | Materials | Textures | Total Triangles |
|---|---|---|---|---|---|
| `Tent 6.5_6.5.glb` | 10.04 MB | 3 | 3 | 6 | 69,298 |
| `Tent_5_5.glb` | 9.74 MB | 3 | 3 | 6 | 80,716 |
| `Tent_8_8.glb` | 10.62 MB | 3 | 3 | 6 | 85,084 |

---

## Detail: `Tent 6.5_6.5.glb`

- **File size**: 10.04 MB
- **Triangle count**: 69,298
- **Meshes**: 3
- **Materials**: 3
- **Textures**: 6

### Meshes and Primitives

| Mesh Name | Triangles | Material Assigned | UV0 | UV1 | Texture Slots |
|---|---|---|---|---|---|
| `Mesh` | 2,566 | `fabric_Mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh` | 1,196 | `Inner_fabric` | Yes | No | none |
| `Mesh.002` | 9,520 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh.001` | 56,016 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |

### Materials

| Material Name | Base Color | Roughness | Metallic | Textures Active |
|---|---|---|---|---|
| `fabric_Mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |
| `Inner_fabric` | [1.00, 1.00, 1.00, 1.00] | 0.7487671971321106 | 0 | none |
| `Metal_mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |

### Node Hierarchy & Mesh Mapping

| Node Name | Associated Mesh |
|---|---|
| `fabric` | `Mesh` |
| `leg` | `Mesh.002` |
| `mechanism` | `Mesh.001` |
| `TENT_6_5_6_5` | *(container)* |

---

## Detail: `Tent_5_5.glb`

- **File size**: 9.74 MB
- **Triangle count**: 80,716
- **Meshes**: 3
- **Materials**: 3
- **Textures**: 6

### Meshes and Primitives

| Mesh Name | Triangles | Material Assigned | UV0 | UV1 | Texture Slots |
|---|---|---|---|---|---|
| `Mesh.003` | 10,740 | `fabric_Mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh.003` | 4,440 | `Inner_fabric` | Yes | No | none |
| `Mesh.005` | 9,520 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh.004` | 56,016 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |

### Materials

| Material Name | Base Color | Roughness | Metallic | Textures Active |
|---|---|---|---|---|
| `fabric_Mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |
| `Inner_fabric` | [1.00, 1.00, 1.00, 1.00] | 0.7487671971321106 | 0 | none |
| `Metal_mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |

### Node Hierarchy & Mesh Mapping

| Node Name | Associated Mesh |
|---|---|
| `fabric` | `Mesh.003` |
| `leg5` | `Mesh.005` |
| `mechanism3` | `Mesh.004` |
| `TENT_5_5` | *(container)* |

---

## Detail: `Tent_8_8.glb`

- **File size**: 10.62 MB
- **Triangle count**: 85,084
- **Meshes**: 3
- **Materials**: 3
- **Textures**: 6

### Meshes and Primitives

| Mesh Name | Triangles | Material Assigned | UV0 | UV1 | Texture Slots |
|---|---|---|---|---|---|
| `Mesh` | 1,157 | `Inner_fabric` | Yes | No | none |
| `Mesh` | 2,475 | `fabric_Mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh.001` | 19,752 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |
| `Mesh.002` | 61,700 | `Metal_mat` | Yes | No | baseColor, metallicRoughness, normal |

### Materials

| Material Name | Base Color | Roughness | Metallic | Textures Active |
|---|---|---|---|---|
| `Inner_fabric` | [1.00, 1.00, 1.00, 1.00] | 0.7487671971321106 | 0 | none |
| `fabric_Mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |
| `Metal_mat` | [1.00, 1.00, 1.00, 1.00] | 1 | 1 | baseColor, metallicRoughness, normal |

### Node Hierarchy & Mesh Mapping

| Node Name | Associated Mesh |
|---|---|
| `fabric` | `Mesh` |
| `leg` | `Mesh.001` |
| `mechanism` | `Mesh.002` |
| `Tent_8_8` | *(container)* |

---

## Section-to-Mesh & Material Mapping

Based on the audit of the GLB geometry and materials:

| Section ID | Display Name | Associated Mesh / Node Targets | Material Target | UV Aspect | Notes |
|---|---|---|---|---|---|
| `canopy-front` | Front Peak | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x768 (4:3) | Front triangular roof quadrant |
| `canopy-right` | Right Peak | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x768 (4:3) | Right triangular roof quadrant |
| `canopy-back` | Back Peak | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x768 (4:3) | Back triangular roof quadrant |
| `canopy-left` | Left Peak | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x768 (4:3) | Left triangular roof quadrant |
| `valance-front`| Front Valance | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x256 (4:1) | Front horizontal perimeter overhang |
| `valance-right`| Right Valance | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x256 (4:1) | Right horizontal perimeter overhang |
| `valance-back` | Back Valance | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x256 (4:1) | Back horizontal perimeter overhang |
| `valance-left` | Left Valance | Node: `fabric`, Primitive: `fabric_Mat` | `fabric_Mat` | 1024x256 (4:1) | Left horizontal perimeter overhang |
| `back-wall` | Full Back Wall | Dynamic mesh target: `back-wall-mesh` | `BackWall_Mat` | 1024x1024 (1:1)| Full-height wall enclosure attached to rear legs |
| `frame-legs` | Frame & Hardware | Nodes: `leg`, `leg5`, `mechanism`, `mechanism3` | `Metal_mat` | N/A | Metallic hardware finish (Anodized Silver / Black) |

### Key Assumptions & Technical Strategy
1. **Multi-face Texture Atlas / Dynamic Layering**: The primary canopy mesh uses `fabric_Mat`. In the 3D pipeline, we compose the section canvases into an active high-resolution texture map assigned to `fabric_Mat.map` using standard sRGB color space, anisotropic filtering, and `needsUpdate = true`.
2. **Raycasting / Click-to-Select**: Raycasting on the 3D tent calculates intersection normal vectors and bounding zones to disambiguate Front, Back, Left, and Right peaks/valances, smoothly tweening the camera to the corresponding preset.
3. **Dynamic Wall Mounts**: When the customer selects a wall package option (e.g., `backWall: 'single-sided'`), the 3D scene mounts a rigged backdrop mesh aligned with the back legs of the tent frame, applying the synchronized `back-wall` canvas texture.
