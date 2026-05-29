export default function artplayerPluginChapter(options: { chapters: Array<{ start: number; end: number; title: string }> }) {
  return (art: any) => {
    const { chapters = [] } = options;

    if (!chapters || chapters.length === 0) {
      return {
        name: "artplayerPluginChapter",
      };
    }

    art.on("ready", () => {
      const $progress = art.template.$progress;
      if (!$progress) return;

      $progress.classList.add("artplayer-plugin-chapter");

      const $chapters = document.createElement("div");
      $chapters.className = "art-chapters";

      chapters.forEach((chapter) => {
        const $chapter = document.createElement("div");
        $chapter.className = "art-chapter";
        
        const width = ((chapter.end - chapter.start) / art.duration) * 100;
        $chapter.style.width = `${width}%`;

        const $inner = document.createElement("div");
        $inner.className = "art-chapter-inner";
        $inner.style.backgroundColor = chapter.title === "intro" ? "#ff6b9d" : "#c084fc";

        const $title = document.createElement("div");
        $title.className = "art-chapter-title";
        $title.textContent = chapter.title;

        $inner.appendChild($title);
        $chapter.appendChild($inner);
        $chapters.appendChild($chapter);

        $inner.addEventListener("click", () => {
          art.currentTime = chapter.start;
        });

        $inner.addEventListener("mouseenter", () => {
          $title.style.display = "block";
        });

        $inner.addEventListener("mouseleave", () => {
          $title.style.display = "none";
        });
      });

      $progress.appendChild($chapters);
    });

    return {
      name: "artplayerPluginChapter",
    };
  };
}
