import FileSaver from "file-saver";
import JSZip from "jszip";
import moment from "moment";
import { promiseMap } from "../../utils/promises";
import { FileEntry } from "./file-parser/models/FileEntry";

export class ZipClient {
    public static async extractFiles(files: Blob[]): Promise<FileEntry[]> {
        const filesEntries = await promiseMap(files, async file => {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            return await promiseMap(
                Object.entries(contents.files).filter(([_, obj]) => !obj.dir),
                async ([fullPath, obj]) => {
                    const blob = await obj.async("blob");
                    return FileEntry.create({
                        blob,
                        path: fullPath,
                    });
                }
            );
        });

        return filesEntries.flat();
    }

    public static async zipAndDownload(files: FileEntry[], fileName: string): Promise<void> {
        const zip = new JSZip();

        files.forEach(({ path, blob }) => {
            zip.file(path, blob);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        const date = moment().format("YYYYMMDDHHmm");
        FileSaver.saveAs(blob, `${fileName}-${date}.zip`);
    }
}
