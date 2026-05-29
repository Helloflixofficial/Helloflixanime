export default function artplayerPluginUploadSubtitle() {
  return (art: any) => {
    art.on("ready", () => {
      // This is a placeholder for upload subtitle functionality
      // Would typically add a button to upload custom subtitle files
      console.log("Upload subtitle plugin loaded");
    });

    return {
      name: "artplayerPluginUploadSubtitle",
    };
  };
}
