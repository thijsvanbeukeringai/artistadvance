type FolderNode = { name: string; subfolders?: string[] };

const STRUCTURE: FolderNode[] = [
  { name: "00_GENERAL", subfolders: ["Deal memo", "Contract", "Overige documenten"] },
  { name: "01_STAGE", subfolders: ["Stage specs", "Drawings", "Front/back/side views"] },
  { name: "02_LIGHTING", subfolders: ["Lichtplan", "Patch file", "WYSIWYG", "GrandMA showfile", "Venue light specs"] },
  { name: "03_VIDEO", subfolders: ["Pixel mapping", "Resolume XML", "LED content", "Video specs"] },
  { name: "04_SFX_PYRO", subfolders: ["SFX cue list", "Pyro cue list", "Pyro/SFX rider"] },
  { name: "05_AUDIO", subfolders: ["Sound rider", "Stageplot", "Audio specs venue", "Monitor specs"] },
  { name: "06_LASER", subfolders: ["Laser specs", "Laser positions", "Pangolin files"] },
  { name: "07_TRAVEL", subfolders: ["Flight tickets", "Hotel confirmations", "Ground transport"] },
  { name: "08_SIGNED_RIDERS", subfolders: ["Tech rider getekend", "Hospitality rider getekend"] },
];

export default function DropboxTree({ rootFolder }: { rootFolder?: string | null }) {
  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
        <div>
          <h3 className="font-bold text-ink-900">Dropbox structuur</h3>
          <p className="text-[11px] text-ink-400 font-mono mt-0.5">{rootFolder ?? "/{Artist}/{Show} - {Date}/"}</p>
        </div>
        <span className="text-[10px] font-bold uppercase bg-ink-100 text-ink-500 px-2 py-1 rounded-full">spec v2</span>
      </header>
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 font-mono text-xs">
        {STRUCTURE.map((node) => (
          <div key={node.name}>
            <div className="flex items-center gap-2 text-ink-900 font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-500">
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              {node.name}/
            </div>
            <ul className="mt-1 ml-5 space-y-0.5 text-ink-500">
              {node.subfolders?.map((sf) => (
                <li key={sf}>├ {sf}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
