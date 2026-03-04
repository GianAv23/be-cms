import { ImageCategory } from 'generated/prisma/enums';

export interface IStorageBucketService {
  save(): Promise<void>;
  delete(): Promise<void>;

  uploadImage(
    image: Express.Multer.File,
    category: ImageCategory,
  ): Promise<string>;

  getImageLinkFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<string>;

  getImageLinksFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<Array<string>>;

  deleteImageFromImageLink(
    imageLink: string,
    category: ImageCategory,
  ): Promise<void>;

  getImageFile(
    imageLink: string,
    category: ImageCategory,
  ): Promise<Buffer<ArrayBufferLike>>;
}
