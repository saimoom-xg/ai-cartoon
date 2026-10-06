import assetRecords from "../../../assets/asset-library.json" with {
  type: "json",
};
import {
  ASSET_TYPES,
  type AssetMetadata,
  type AssetType,
} from "../types/cartoon.ts";

function isAssetType(type: string): type is AssetType {
  return ASSET_TYPES.some((assetType) => assetType === type);
}

export const ASSETS: AssetMetadata[] = assetRecords.map((record) => {
  if (!isAssetType(record.type)) {
    throw new Error(`Unsupported asset type in asset library: ${record.type}`);
  }

  return {
    id: record.id,
    name: record.name,
    type: record.type,
    category: record.category,
    image: `/${record.image_path.replace(/^\/+/, "")}`,
    description: record.description,
    tags: record.tags,
  };
});

export const ASSETS_BY_ID = new Map(ASSETS.map((asset) => [asset.id, asset]));
