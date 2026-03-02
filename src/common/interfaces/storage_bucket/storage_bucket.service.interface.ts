import { ImageCategory } from 'generated/prisma/enums';

export interface IStorageBucketService {
  save(): Promise<void>;
  delete(): Promise<void>;

  // Merged Picture Operations
  uploadPicture(
    picture: Express.Multer.File,
    category: ImageCategory,
  ): Promise<string>;
  getPictureLinkFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<string>;
  getPictureLinksFromParentUUID(
    parentUUID: string,
    category: ImageCategory,
  ): Promise<Array<string>>;
  deletePictureFromPictureLink(
    pictureLink: string,
    category: ImageCategory,
  ): Promise<void>;
  getPictureFile(
    pictureLink: string,
    category: ImageCategory,
  ): Promise<Buffer<ArrayBufferLike>>;
}
