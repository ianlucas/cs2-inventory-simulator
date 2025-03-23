/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_STICKER_MARKUP,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2StickerMarkup,
  ensure
} from "@ianlucas/cs2-lib";
import { generateInspectLink } from "@ianlucas/cs2-lib-inspect";
import {
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
  useGLTF
} from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { readdir } from "fs/promises";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useRef, useState } from "react";
import { data, redirect, useLoaderData } from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import {
  Box3,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  TextureLoader,
  Vector3
} from "three";
import { useStorageState } from "~/components/hooks/use-storage-state";
import { useTextureLoader } from "~/components/hooks/use-texture-loader";
import {
  paintableWithModelFilter,
  stickerFilter,
  ToolsItemSelect
} from "~/components/tools-item-select";
import { ToolsSelect } from "~/components/tools-select";
import { STICKER_REFERENCE_PATH } from "~/env.server";
import { createFakeInventoryItemFromBase } from "~/utils/inventory";
import { interpolate } from "~/utils/misc";

type StickersState = Record<
  string,
  NonNullable<CS2BaseInventoryItem["stickers"]>[string]
>;

type MarkupState = Record<
  string,
  NonNullable<CS2StickerMarkup[string]>[number]
>;

type StickerDataState = Record<
  string,
  {
    hover: boolean;
    reference?: Mesh<PlaneGeometry, MeshBasicMaterial>;
    scaleSelected: boolean;
    selected: boolean;
  }
>;

type DataState = {
  threeXRange: [number, number];
  source2XRange: [number, number];
  threeYRange: [number, number];
  source2YRange: [number, number];
  source2Scale: number;
  threeScale: number;
};

type ModeType = "translate" | "scale" | "rotate";

function WeaponModel({
  item,
  onComputeDepth
}: {
  item: CS2EconomyItem;
  onComputeDepth: (depth: number) => void;
}) {
  const { scene } = useGLTF(item.getModelBinary());
  const [object, setObject] = useState<Object3D>();

  useEffect(() => {
    const object = scene.children
      .find(
        (node) =>
          (node.type === "Mesh" || node.type === "Group") &&
          node.name.includes(!item.legacy ? "_hd" : "_legacy")
      )
      ?.clone();

    if (object) {
      const meshes = object.type === "Mesh" ? [object] : [...object.children];
      for (const mesh of meshes) {
        if (
          mesh instanceof Mesh &&
          mesh.material instanceof MeshStandardMaterial &&
          mesh.geometry instanceof BufferGeometry
        ) {
          mesh.material.metalness = 0;
          mesh.material.roughness = 0;
          mesh.geometry.center();

          if (mesh.material.map !== null && item.texture) {
            const material = mesh.material.clone();
            const texture = mesh.material.map.clone();

            new TextureLoader().load(item.getTextureImage(), (imageTexture) => {
              texture.source = imageTexture.source;
              material.map = texture;
              material.needsUpdate = true;
              mesh.material = material;
            });
          }
        }
      }
      object.scale.set(0.05, 0.05, 0.05);
      object.rotation.y = Math.PI;

      const box = new Box3().setFromObject(object);
      const boxSize = new Vector3();
      box.getSize(boxSize);
      onComputeDepth(boxSize.z);
    }

    setObject(object);
  }, [item]);

  return object !== undefined ? (
    <>
      <primitive object={object} />
      <boxHelper args={[object, 0xffff00]} />
    </>
  ) : null;
}

function StickerReference({
  mode,
  reference,
  surfaceZ
}: {
  mode: ModeType;
  reference: string;
  surfaceZ: number;
}) {
  const { texture, dimensions } = useTextureLoader(
    `/api/tools/reference?file=${reference}`
  );

  return dimensions !== undefined ? (
    <TransformControls showZ={false} mode={mode}>
      <mesh position={[0, 0, surfaceZ]}>
        <planeGeometry args={[dimensions.width / dimensions.height, 1]} />
        <meshBasicMaterial map={texture} transparent opacity={0.5} />
      </mesh>
    </TransformControls>
  ) : null;
}

function StickerModel({
  markup,
  mode,
  setStickerData,
  slot,
  surfaceZ,
  value
}: {
  markup: MarkupState[string];
  mode: ModeType;
  setStickerData: (
    setter: (currValue: StickerDataState) => StickerDataState
  ) => void;
  slot: string;
  surfaceZ: number;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>[string];
}) {
  const ref = useRef<Mesh<any, any>>(null);
  const item = CS2Economy.getById(value.id);
  const texture = useLoader(TextureLoader, item.getImage());

  function updateHover(value: boolean) {
    setStickerData((stickerData) => ({
      ...stickerData,
      [slot]: { ...stickerData[slot], hover: value }
    }));
  }

  function updateReference(value?: Mesh<any, any>) {
    setStickerData((stickerData) => ({
      ...stickerData,
      [slot]: { ...stickerData[slot], reference: value }
    }));
  }

  useEffect(() => {
    updateReference(ref.current !== null ? ref.current : undefined);
  }, [ref]);

  return (
    <TransformControls
      showX={mode !== "rotate"}
      showY={mode !== "rotate"}
      showZ={mode === "rotate"}
      mode={mode}
      object={ref.current ?? undefined}
      onPointerEnter={() => updateHover(true)}
      onPointerLeave={() => updateHover(false)}
    >
      <mesh
        ref={ref}
        position={[markup.offsets[0], markup.offsets[1], surfaceZ]}
      >
        <planeGeometry args={[1 * 0.2, (0.2 * 192) / 256]} />
        <meshBasicMaterial
          transparent
          alphaTest={0.1}
          side={DoubleSide}
          map={texture}
        />
      </mesh>
    </TransformControls>
  );
}

function Stickers({
  markup,
  mode,
  setStickerData,
  stickers,
  surfaceZ
}: {
  markup: MarkupState;
  mode: ModeType;
  setStickerData: (
    setter: (currValue: StickerDataState) => StickerDataState
  ) => void;
  stickers: StickersState;
  surfaceZ: number;
}) {
  return (
    <>
      {Object.entries(stickers).map(([slot, value]) => (
        <StickerModel
          key={slot}
          markup={markup[slot]}
          mode={mode}
          setStickerData={setStickerData}
          slot={slot}
          surfaceZ={surfaceZ}
          value={value}
        />
      ))}
    </>
  );
}

function StickerItemEditor({
  setStickerData,
  setStickers,
  stickerData,
  stickers
}: {
  setStickerData: (
    setter: (currValue: StickerDataState) => StickerDataState
  ) => void;
  setStickers: (value: StickersState) => void;
  stickerData: StickerDataState;
  stickers: StickersState;
}) {
  function handleStickerItemChange(slot: string) {
    return function handleStickerItemChange(value: CS2EconomyItem) {
      setStickers({
        ...stickers,
        [slot]: {
          ...stickers[slot],
          id: value.id
        }
      });
    };
  }

  return Object.entries(stickers).map(([slot, sticker]) => {
    const data = stickerData[slot];
    return (
      <ToolsItemSelect
        key={slot}
        filterFunction={stickerFilter}
        onChange={handleStickerItemChange(slot)}
        value={CS2Economy.getById(sticker.id)}
      >
        <div>
          Slot: {slot} |{" "}
          {sticker.rotation !== undefined && `Rotation: ${sticker.rotation}`}
          {data.hover ? "HOVER" : "IDLE"} |{" "}
          <input
            type="checkbox"
            checked={data.selected}
            onChange={(event) =>
              setStickerData((stickerData) => ({
                ...stickerData,
                [slot]: { ...data, selected: event.target.checked }
              }))
            }
          />{" "}
          |{" "}
          <input
            type="checkbox"
            checked={data.scaleSelected}
            onChange={(event) =>
              setStickerData((stickerData) => ({
                ...stickerData,
                [slot]: { ...data, scaleSelected: event.target.checked }
              }))
            }
          />
        </div>
      </ToolsItemSelect>
    );
  });
}

function Camera() {
  useFrame((state) => {
    state.camera.rotation.x = 0;
    state.camera.rotation.y = 0;
    state.camera.rotation.z = 0;
  });

  return <PerspectiveCamera makeDefault position={[0, 0, 1]} fov={75} />;
}

export async function loader() {
  if (!STICKER_REFERENCE_PATH) {
    throw redirect("/");
  }
  return data({
    references: await readdir(STICKER_REFERENCE_PATH)
  });
}

export default function ToolsItemViewerIndex() {
  const { references } = useLoaderData<typeof loader>();
  const [reference, setReference] = useState<string>();
  const [item, setItem] = useState(() => CS2Economy.getById(11276));
  const [surfaceZ, setSurfaceZ] = useState(0);
  const [markup, setMarkup] = useState<MarkupState>({});
  const [stickers, setStickers] = useState<StickersState>({});
  const [stickerData, setStickerData] = useState<StickerDataState>({});
  const [mode, setMode] = useState<ModeType>("translate");
  const [output, setOutput] = useState<string>();
  const [data, setData] = useState<DataState>();
  const [stickerMappingData, setStickerMappingData] = useStorageState<
    Record<string, DataState>
  >("$devStickerMappingData", {});

  const mappingKey = `${item.def}-${item.legacy ? "legacy" : "hd"}`;

  function handleGetDataClick() {
    console.log(stickerData);

    const transformData = Object.fromEntries(
      Object.entries(stickerData).map(([slotId, sticker]) => {
        if (sticker.reference === undefined || !sticker.selected) {
          return [slotId, undefined];
        }

        return [
          slotId,
          {
            isScaleReference: sticker.scaleSelected,
            rotation: sticker.reference.rotation.z,
            scale: sticker.reference.scale.x,
            x: sticker.reference.position.x,
            y: sticker.reference.position.y
          }
        ];
      })
    );

    const enginePairs: {
      source2: { x: number; y: number; rotation: number };
      three: { x: number; y: number; rotation: number };
    }[] = [];

    let threeScale = 0;
    let source2Scale = 0;

    for (const slotId of Object.keys(transformData)) {
      const threeTransform = transformData[slotId];
      if (threeTransform === undefined) {
        continue;
      }

      const source2Transform = markup[slotId];

      if (threeTransform.isScaleReference) {
        threeScale = threeTransform.scale;
        source2Scale = source2Transform.scale;
      }

      enginePairs.push({
        source2: {
          x: source2Transform.offsets[0],
          y: source2Transform.offsets[1],
          rotation: source2Transform.rotation ?? 0
        },
        three: {
          x: threeTransform.x,
          y: threeTransform.y,
          rotation: threeTransform.rotation
        }
      });
    }

    const [firstPoint, secondPoint] = enginePairs;
    let xPointA = firstPoint;
    let xPointB = secondPoint;

    if (xPointB.three.x > xPointA.three.x) {
      [xPointA, xPointB] = [xPointB, xPointA];
    }

    const threeXRange = [xPointB.three.x, xPointA.three.x] as [number, number];
    const source2XRange = [xPointB.source2.x, xPointA.source2.x] as [
      number,
      number
    ];

    let yPointA = firstPoint;
    let yPointB = secondPoint;

    if (yPointB.three.y > yPointA.three.y) {
      [yPointA, yPointB] = [yPointB, yPointA];
    }

    const threeYRange = [yPointB.three.y, yPointA.three.y] as [number, number];
    const source2YRange = [yPointB.source2.y, yPointA.source2.y] as [
      number,
      number
    ];

    const engineMapping = {
      threeXRange,
      source2XRange,
      threeYRange,
      source2YRange,
      source2Scale,
      threeScale
    };

    setData(engineMapping);
    setStickerMappingData((current: any) => ({
      ...current,
      [mappingKey]: engineMapping
    }));
    setOutput(JSON.stringify(engineMapping, null, 2));
  }

  function applyDimentions(type: "width" | "height") {
    return function applyDimentions() {
      console.log(stickerData);
      const values = Object.values(stickerData);
      const selected = ensure(
        values.find(({ selected }) => selected)?.reference
      );
      for (const { reference } of values) {
        if (reference === undefined) {
          continue;
        }
        switch (type) {
          case "width":
            reference.scale.x = selected.scale.x;
            reference.scale.y = selected.scale.x;
            break;

          case "height":
            reference.scale.x = selected.scale.y;
            reference.scale.y = selected.scale.y;
            break;
        }
      }
    };
  }

  function handleInspect() {
    if (data === undefined) {
      return;
    }
    const toGameX = interpolate(...data.threeXRange, ...data.source2XRange);
    const toGameY = interpolate(...data.threeYRange, ...data.source2YRange);
    const itemStickers: any = {};
    for (const [slot, sticker] of Object.entries(stickerData)) {
      if (sticker.reference === undefined) {
        continue;
      }
      const game = markup[slot];
      itemStickers[slot] = {
        id: stickers[slot].id,
        x: Number(
          (toGameX(sticker.reference.position.x) - game.offsets[0]).toFixed(4)
        ),
        y: Number(
          (toGameY(sticker.reference.position.y) - game.offsets[1]).toFixed(4)
        )
      };
    }
    const fakeItem = createFakeInventoryItemFromBase({
      id: item.id,
      stickers: itemStickers
    });
    console.log(generateInspectLink(fakeItem));
  }

  function handleComputeDepth(depth: number) {
    setSurfaceZ(depth / 2);
  }

  useEffect(() => {
    const parent = item.parent ?? item;
    const markup = CS2_STICKER_MARKUP[ensure(parent.def)]?.filter(
      (markup) => parent.legacy === markup.legacy
    );
    setMarkup(
      markup !== undefined
        ? Object.fromEntries(
            markup.map((markupData) => [markupData.slot, markupData])
          )
        : {}
    );
    setStickers(
      markup !== undefined
        ? Object.fromEntries(markup.map(({ slot }) => [slot, { id: 11429 }]))
        : {}
    );
    setStickerData(
      markup !== undefined
        ? Object.fromEntries(
            markup.map((markupData) => [
              markupData.slot,
              {
                hover: false,
                scaleSelected: false,
                selected: false
              }
            ])
          )
        : {}
    );
  }, [item]);

  useEffect(() => {
    function handleKeyUp(event: KeyboardEvent) {
      switch (event.key) {
        case "1":
          setMode("translate");
          break;
        case "2":
          setMode("scale");
          break;
        case "3":
          setMode("rotate");
          break;
      }
    }
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen font-mono text-xs">
      <ClientOnly>
        {() => (
          <Canvas>
            <ambientLight intensity={Math.PI / 2} />
            <Camera />
            <axesHelper />
            <Suspense>
              <WeaponModel
                item={item}
                key={item.id}
                onComputeDepth={handleComputeDepth}
              />
            </Suspense>
            {reference !== undefined && (
              <StickerReference
                reference={reference}
                surfaceZ={surfaceZ}
                mode={mode}
              />
            )}
            <Stickers
              markup={markup}
              mode={mode}
              setStickerData={setStickerData}
              stickers={stickers}
              surfaceZ={surfaceZ}
            />
            <OrbitControls enableRotate={false} />
            <EffectComposer>
              <Noise
                blendFunction={BlendFunction.ADD}
                opacity={0.4}
                premultiply
              />
            </EffectComposer>
          </Canvas>
        )}
      </ClientOnly>
      <div className="fixed top-0 left-0 p-4">
        <div>
          {stickerMappingData[mappingKey] ? "✅ Saved." : "❌ Not saved."}
        </div>
        <ToolsSelect
          onChange={setReference}
          options={references}
          value={reference}
        />
        <ToolsItemSelect
          filterFunction={paintableWithModelFilter}
          onChange={setItem}
          value={item}
        />
        <StickerItemEditor
          setStickerData={setStickerData}
          setStickers={setStickers}
          stickerData={stickerData}
          stickers={stickers}
        />
        <div className="flex items-center gap-4">
          <button onClick={handleGetDataClick}>Set data</button>
          <button onClick={handleInspect}>Inspect</button>
          <button onClick={applyDimentions("width")}>AW</button>
          <button onClick={applyDimentions("height")}>AH</button>
        </div>
        {output !== undefined && (
          <code className="pointer-events-none select-none">
            <pre>{output}</pre>
          </code>
        )}
      </div>
    </div>
  );
}
