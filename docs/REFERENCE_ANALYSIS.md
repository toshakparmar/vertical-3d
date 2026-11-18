# Reference Product Analysis & Customization UX Flow

**Reference URL:** [MVP Visuals 10x10 Custom Canopy Tent](https://mvpvisuals.com/products/10x10-custom-canopy-tent)  
**Associated Technical Test PDF:** `docs/Vertical 3D Instruction & reference link (1).pdf`

---

## 1. Executive Summary & Product Taxonomy

The reference product is an industry-standard commercial pop-up canopy tent (10ft × 10ft footprint) commonly utilized in trade activations, sporting events, and corporate marketing. MVP Visuals emphasizes full dye-sublimation print quality (unlimited colors, full bleed, waterproof UV-resistant 600D polyester) across all fabric faces, mounted upon a commercial-grade 40mm hexagonal anodized aluminum framework.

In an interactive configurator setting, the tent structure divides naturally into **geometric print sections** (the 2D printable canvases mapped directly to 3D submeshes) and **hardware/accessory selection variants** (driving SKU, base pricing, and optional attachments).

---

## 2. Configurable Sections & Canvas Mapping

To achieve high-fidelity 2D-to-3D synchronization, each printable surface requires an independent UV canvas with safe-area and bleed margins:

| Section ID | Display Name | 3D Mesh Target / Region | Aspect Ratio (W:H) | Customization Capabilities |
|---|---|---|---|---|
| `canopy-front` | Front Canopy Peak | Front triangular roof panel | 1 : 0.75 | Text, Logo/Image, Background Color, Alignment |
| `canopy-right` | Right Canopy Peak | Right triangular roof panel | 1 : 0.75 | Text, Logo/Image, Background Color, Alignment |
| `canopy-back` | Back Canopy Peak | Back triangular roof panel | 1 : 0.75 | Text, Logo/Image, Background Color, Alignment |
| `canopy-left` | Left Canopy Peak | Left triangular roof panel | 1 : 0.75 | Text, Logo/Image, Background Color, Alignment |
| `valance-front`| Front Valance | Front perimeter horizontal skirt | 4 : 1 | Text, Tagline, Phone/Web URL, Background Color |
| `valance-right`| Right Valance | Right perimeter horizontal skirt | 4 : 1 | Text, Tagline, Background Color |
| `valance-back` | Back Valance | Back perimeter horizontal skirt | 4 : 1 | Text, Tagline, Background Color |
| `valance-left` | Left Valance | Left perimeter horizontal skirt | 4 : 1 | Text, Tagline, Background Color |
| `back-wall`    | Full Back Wall | Full vertical back backdrop | 1 : 1 | Full-bleed graphics, large company branding, photo backdrops |
| `side-walls`   | Side Wall Pair | Left & Right vertical walls | 1 : 1 | Optional add-on wall graphics |
| `frame-legs`   | Hardware & Legs | Anodized aluminum / steel frame | N/A | Color / Finish (Silver anodized, Matte Black, White) |

---

## 3. Product Options & Variant Hierarchy

The configurator supports a tiered configuration hierarchy that determines base SKU, weight, shipping tier, and component pricing:

### A. Base Package
1. **Canopy + Frame (Complete Kit)**: Standard commercial setup with canopy top + hardware frame + roller bag + ground stakes.
2. **Canopy Top Only (Replacement)**: Custom printed fabric top only (fits existing 10x10 hex frames).
3. **Hardware Frame Only**: Heavy-duty frame replacement.

### B. Frame Grade / Material
- **Standard Steel (32mm square)**: Entry-level budget option (+0).
- **Commercial Hex Aluminum (40mm)**: Default standard commercial specification (lightweight, rust-free, rigid) (+$120).
- **Heavy-Duty Hex Aluminum (50mm)**: Extreme wind-load outdoor specification (+$250).

### C. Wall Attachments
- **None**: Open 4-sided walk-through.
- **Full Back Wall (Single-Sided Print)**: Heavy 600D fabric wall with velcro top attachments (+$149).
- **Full Back Wall (Double-Sided Print)**: Inside & outside branded (+$229).
- **2 Half Walls (with support rail bars)**: Crowd control / counter height barriers (+$189).
- **3 Full Walls (Enclosed Booth)**: Back + Left + Right walls (+$389).

### D. Accessories & Add-Ons
- **Deluxe Wheeled Roller Bag**: Heavy-duty 1680D nylon with ball-bearing wheels (+$49).
- **Heavy Sandbag Weights (Set of 4)**: 30 lbs each for asphalt/concrete stability (+$59).
- **Heavy Cast Iron Weight Plates (Set of 4)**: Interlocking foot plates (+$89).
- **Production Speed**: Standard 5-day turnaround (free) vs Rush 48-Hour Production (+$95).

---

## 4. UX Flow & Information Architecture

The configurator follows a 4-step progressive disclosure model, maintaining continuous 3D visibility alongside an intuitive 2D canvas editor:

```
[ Step 1: Base Configuration ]
   ├── Choose Tent Size (10x10, 8x8, 5x5)
   ├── Select Package (Canopy + Frame vs Canopy Only)
   └── Select Hardware / Frame Grade (Hex Aluminum vs Steel)
        ▼
[ Step 2: Custom Artwork & Sections (2D <-> 3D Sync) ]
   ├── Interactive 3D Mesh Click OR Section Tabs (Roof Peaks, Valances, Back Wall)
   ├── 2D Canvas Editor per section:
   │    ├── Background color selection (Hex/Palette)
   │    ├── Text layers (Font, Size, Color, Rotation, Alignment)
   │    ├── Image upload (Logos, vectors, photos with drag/drop, crop, scale)
   │    └── Transform handles & snap guides
   └── Live 3D texture updating with camera damping
        ▼
[ Step 3: Walls & Accessories ]
   ├── Add Back Wall (triggers 3D back-wall mesh visibility)
   ├── Add Side Walls / Half Walls
   └── Add Wheel Bag & Foot Weights
        ▼
[ Step 4: Review, Dynamic Pricing & Checkout ]
   ├── Dynamic quote generation (breakdown: base + frame + print + add-ons)
   ├── 3D multi-angle inspection & screenshot rendering
   ├── Download Production PDF Proof (dimensions, vector placement, CMYK notes)
   └── "Add to Cart" -> Shopify cart drawer with line-item metadata & JSON config URL
```

---

## 5. Architectural Alignment with Take-Home Requirements

1. **State Independence**: 2D canvas coordinates are normalized [0..1] UV coordinates, allowing dynamic resolution scaling (e.g. 512px low-memory mobile preview up to 2048px high-DPI desktop texture) without drift.
2. **Shopify Integration Readiness**: Customer choices output clean line-item properties (`_configuration_id`, `_quote_id`, `_pdf_url`, `_config_json_url`) preserving the server price authority model.
3. **Reusability**: All steps, options, mesh associations, and pricing rules are specified via declarative schema (`ProductDefinition`), making it trivial to introduce additional tent dimensions (8x8, 5x5, 6.5x6.5) or table covers without refactoring the engine.

