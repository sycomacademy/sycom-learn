/** Result of uploading a binary picked in the editor; `src` is typically a CDN public id. */
export type TiptapEditorUploadResult = {
  src: string;
  alt?: string;
};

export type TiptapEditorUploadFn = (file: File) => Promise<TiptapEditorUploadResult>;
