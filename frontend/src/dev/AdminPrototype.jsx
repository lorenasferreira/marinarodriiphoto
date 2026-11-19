import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import inventory from "./photoInventory.json";
import { demoProjects, placeholder } from "./demoProjects";
import "./prototype.css";

const categories = [...new Set(inventory.map(photo => photo.category))];
const emptyProject = id => ({ id, slug: id, title: 'Untitled sample', subtitle: '', description: '', credits: [], status: 'draft', releaseAuthorized: false, coverImage: placeholder('Cover photograph'), galleryImages: [], translations: {} });

function ProjectEditor({ project, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => structuredClone(project));
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);
  const localized = draft.translations[language] || {};
  const setContent = (key, value) => { setSaved(false); setDraft(current => ({ ...current, translations: { ...current.translations, [language]: { ...current.translations[language], [key]: value } } })); };
  return <section className="admin-editor" aria-label="Project editor"><div className="admin-section-heading"><div><p className="prototype-eyebrow">Project workspace</p><h2>{project.title}</h2></div><button onClick={onCancel}>Close editor</button></div>
    <p className="admin-note">Fictional samples only. Saving and publication controls affect this browser session; no public content changes.</p>
    <form onSubmit={event => { event.preventDefault(); setSaved(onSave(draft) !== false); }}>
      <label>Internal identifier<input value={draft.id} disabled /></label>
      <label>Slug<input value={draft.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required onChange={event => setDraft({ ...draft, slug: event.target.value })} /></label>
      <div className="admin-languages" role="group" aria-label="Content language">{['en','pt','es','ca'].map(lang => <button type="button" key={lang} aria-pressed={lang === language} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</button>)}</div>
      <p className="admin-note">Editing {language.toUpperCase()} content. Empty fields fall back to the supplied original; sample prose is not a verified translation.</p>
      <label>Title<input value={localized.title || ''} placeholder={draft.title} onChange={event => setContent('title',event.target.value)} /></label>
      <label>Introduction<textarea rows={2} value={localized.subtitle || ''} placeholder={draft.subtitle} onChange={event => setContent('subtitle',event.target.value)} /></label>
      <label>Artist statement<textarea rows={5} value={localized.description || ''} placeholder={draft.description} onChange={event => setContent('description',event.target.value)} /></label>
      <label>Credits, one per line<textarea rows={2} value={localized.credits?.join('\n') || ''} onChange={event => setContent('credits', event.target.value.split('\n').filter(Boolean))} /></label>
      <label>Award / exhibition details<textarea rows={2} value={localized.awardDetails || ''} onChange={event => setContent('awardDetails', event.target.value)} /></label>
      <label>Cover frame<select value={draft.coverImage?.id || 'cover-photograph'} onChange={event => setDraft({ ...draft, coverImage: placeholder(event.target.selectedOptions[0].text) })}>{['Cover photograph','Exhibition view','Portrait study','Artwork detail','Behind the scenes'].map(label => <option key={label} value={label.toLowerCase().replaceAll(' ','-')}>{label}</option>)}</select></label>
      <fieldset><legend>Gallery frames</legend>{['Exhibition view','Portrait study','Artwork detail','Behind the scenes'].map(label => <label className="admin-check" key={label}><input type="checkbox" checked={draft.galleryImages.some(image => image.id === label.toLowerCase().replaceAll(' ','-'))} onChange={event => setDraft({ ...draft, galleryImages: event.target.checked ? [...draft.galleryImages, placeholder(label)] : draft.galleryImages.filter(image => image.id !== label.toLowerCase().replaceAll(' ','-')) })} />{label}</label>)}</fieldset>
      <div className="admin-mini-gallery"><img src={draft.coverImage.src} alt="Sample cover frame" />{draft.galleryImages.map(image => <img key={image.id} src={image.src} alt={image.alt} />)}</div>
      <label>Publication simulation<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="draft">Draft</option><option value="published" disabled={project.id === 'demo-melanina'}>Published (simulation only)</option></select></label>
      {project.id === 'demo-melanina' && <p className="admin-note">Melanina is locked to draft until actual release approval.</p>}
      <div className="admin-actions"><button className="admin-primary" type="submit">Save sample in memory</button><button type="button" onClick={() => { setDraft(structuredClone(project)); setSaved(false); }}>Reset edits</button></div>
      <p role="status">{saved ? 'Sample saved in this session. Production unchanged.' : ''}</p>
    </form>
  </section>;
}

function ProjectManager({ projects, updateProjects, record }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  return <><div className="admin-section-heading"><div><p className="prototype-eyebrow">Independent work</p><h1>Personal Projects</h1></div><button className="admin-primary" onClick={() => setEditing(emptyProject(`sample-${crypto.randomUUID()}`))}>Create sample project</button></div>
    <p className="admin-note">Four supplied identification labels. All initial records are drafts. State badges below describe simulated state only.</p>
    <div className="admin-project-list">{projects.map(project => <button key={project.id} className="admin-project-row" onClick={() => { setEditing(project); setError(''); }}><img src={project.coverImage.src} alt="Labeled placeholder" /><span><strong>{project.translations.en?.title || project.title}</strong><small>{project.slug}</small></span><span className="admin-badge">{project.status === 'published' ? 'Simulated published' : 'Draft'}</span><span aria-hidden="true">↗</span></button>)}</div>
    {error && <p role="alert">{error}</p>}
    {editing && <ProjectEditor key={editing.id} project={editing} onCancel={() => setEditing(null)} onSave={project => {
      if (projects.some(item => item.id !== project.id && item.slug === project.slug)) {setError('This slug already exists. Choose a unique slug.');return false;}
      if (project.id === 'demo-melanina') project = {...project,status:'draft'};
      updateProjects(current => current.some(item => item.id === project.id) ? current.map(item => item.id === project.id ? project : item) : [...current,project]); record(`Saved sample project: ${project.title}`);setError('');
    }} />}
  </>;
}

function PhotoManager({ photos, setPhotos, record, urls }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [undo, setUndo] = useState(null);
  const upload = useRef(null);
  const replace = useRef(null);
  const previewDialog = useRef(null);
  const photo = photos.find(item => item.id === selected);
  useEffect(() => { if (preview) { const node = previewDialog.current; node.showModal(); return () => node.close(); } }, [preview]);
  const shown = photos.filter(photo => (category === 'all' || photo.category === category) && `${photo.filename} ${photo.id}`.toLowerCase().includes(query.toLowerCase()));
  function mutate(next, message) { setUndo(photos); setPhotos(next); record(message); setNotice(`${message} — simulated locally.`); }
  function move(direction) {
    const index = photos.findIndex(item => item.id === selected);
    const destination = Math.max(0, Math.min(photos.length - 1, index + direction));
    const next = [...photos]; [next[index], next[destination]] = [next[destination],next[index]];
    mutate(next,'Changed display order');
  }
  function readFile(file, replacement) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 20*1024*1024) { setNotice('Choose a JPEG, PNG or WebP image smaller than 20 MB.'); return; }
    const url = URL.createObjectURL(file); urls.current.add(url);
    const image = new Image();
    image.onerror = () => { setNotice('This file could not be decoded as an image.'); URL.revokeObjectURL(url);urls.current.delete(url); };
    image.onload = () => {
      const item = { id: replacement?.id || `local-${crypto.randomUUID()}`, filename: file.name, category: replacement?.category || (category === 'all' ? categories[0] : category), width: image.naturalWidth, height: image.naturalHeight, fileSize: file.size, src: url, thumbnail: url, usage: ['Local prototype only; not in the public website'], hidden: false };
      mutate(replacement ? photos.map(photo => photo.id === replacement.id ? item : photo) : [...photos,item], replacement ? 'Replaced local preview' : 'Added local preview'); setSelected(item.id);
    };
    image.src = url;
  }
  return <><div className="admin-section-heading"><div><p className="prototype-eyebrow">Image library</p><h1>Photography</h1></div><button className="admin-primary" onClick={() => upload.current.click()}>Add local image</button><input hidden ref={upload} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { readFile(event.target.files[0]);event.target.value=''; }} /></div>
    <div className="admin-toolbar"><label>Search photographs<input type="search" placeholder="Filename or stable identifier" value={query} onChange={event => setQuery(event.target.value)} /></label><label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><span>{shown.length} photographs</span></div>
    <div className="admin-feedback" role="status">{notice} {undo && <button onClick={() => {setPhotos(undo);setUndo(null);setNotice('Last image action undone in memory.');}}>Undo last image action</button>}</div>
    <div className="admin-library"><div className="admin-photo-grid">{shown.map(photo => <button key={photo.id} className={`admin-photo ${selected === photo.id ? 'is-selected' : ''} ${photo.hidden ? 'is-hidden-photo' : ''}`} aria-pressed={selected === photo.id} onClick={() => { setSelected(photo.id);setDeleting(false); }}><img src={photo.thumbnail} alt={photo.filename} loading="lazy" width={photo.width} height={photo.height} /><span>{photo.filename}</span>{photo.hidden && <small>Hidden (simulation)</small>}</button>)}{!shown.length && <p>No photographs match this search.</p>}</div>
    <aside className="admin-metadata" aria-label="Photograph metadata">{photo ? <><img src={photo.thumbnail} alt={photo.filename} /><h2>{photo.filename}</h2><dl><dt>Stable ID</dt><dd>{photo.id}</dd><dt>Category</dt><dd>{photo.category}</dd><dt>Dimensions</dt><dd>{photo.width} × {photo.height} px</dd><dt>Original file size</dt><dd>{(photo.fileSize / 1024).toFixed(1)} KB</dd><dt>Known usage</dt><dd>{photo.usage.join('; ')}. Other page usage has not been fully mapped.</dd></dl>
      <label>Alt text (local)<input value={photo.alt || ''} onChange={event => setPhotos(current => current.map(item => item.id === photo.id ? {...item,alt:event.target.value} : item))} /></label>
      <div className="admin-actions"><button onClick={() => setPreview(true)}>Preview image</button><button onClick={() => replace.current.click()}>Replace locally</button><button onClick={() => move(-1)} disabled={photos[0]?.id === photo.id}>Move earlier</button><button onClick={() => move(1)} disabled={photos.at(-1)?.id === photo.id}>Move later</button><button onClick={() => mutate(photos.map(item => item.id === photo.id ? {...item, hidden: !item.hidden} : item),photo.hidden ? 'Restored image visibility' : 'Hid image')}>{photo.hidden ? 'Show image' : 'Hide image'}</button><button onClick={() => setDeleting(true)}>Remove locally</button></div>
      <input hidden ref={replace} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {readFile(event.target.files[0],photo);event.target.value='';}} />
      {deleting && <div className="admin-confirm"><p>Remove this image from this session? The original file will remain unchanged.</p><button onClick={() => {mutate(photos.filter(item => item.id !== selected),'Removed local image');setDeleting(false);setSelected(null);}}>Confirm local removal</button><button onClick={() => setDeleting(false)}>Cancel</button></div>}
      {preview && <dialog ref={previewDialog} className="admin-image-dialog" aria-label="Image preview" onCancel={event => {event.preventDefault();setPreview(false);}} onKeyDown={event => {if(event.key === 'Escape'){event.preventDefault();setPreview(false);}}}><button autoFocus onClick={() => setPreview(false)}>Close preview</button><img src={photo.src} alt={photo.alt || photo.filename} /></dialog>}
    </> : <><p className="prototype-eyebrow">Inspect a photograph</p><p>Select an image to see its original dimensions, file size and local controls.</p></>}</aside></div>
  </>;
}

export default function AdminPrototype() {
  const urls = useRef(new Set());
  useEffect(() => { const owned = urls.current; return () => owned.forEach(url => URL.revokeObjectURL(url)); }, []);
  const [photos, setPhotos] = useState(inventory);
  const [projects, setProjects] = useState(demoProjects);
  const [changes, setChanges] = useState([]);
  const record = message => setChanges(current => [{id:crypto.randomUUID(),message,time:new Date().toLocaleTimeString()},...current].slice(0,8));
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-brand" to="/admin"><img src="/assets/images/ui/logo-black.png" alt="" /><span>Marina Rodrigues<small>Studio workspace</small></span></Link><p className="prototype-eyebrow">Manage</p><nav aria-label="Administration"><NavLink end to="/admin">Overview</NavLink><NavLink to="/admin/photos">Photography</NavLink><NavLink to="/admin/projects">Personal Projects</NavLink><NavLink to="/admin/uploads">Upload planning</NavLink></nav><div className="admin-sidebar-bottom"><Link to="/dev/personal-projects">Project layout previews ↗</Link><Link to="/">View public website ↗</Link><span>Development only</span></div></aside>
    <main className="admin-main"><aside className="demo-notice"><strong>Local administration prototype</strong><p>Real image inventory · Mock edits in memory · No API writes · Reload resets all changes</p></aside><Routes>
      <Route index element={<><div className="admin-section-heading"><div><p className="prototype-eyebrow">Studio overview</p><h1>A place for your work.</h1></div><Link className="admin-primary" to="/admin/photos">Open image library ↗</Link></div><p className="admin-introduction">Organise photographs, shape project stories and prepare the next collection.</p><div className="admin-statistics">{[[photos.length,'Photographs','Real inventory + local edits'],[categories.length,'Categories','Existing commercial collections'],[projects.length,'Project samples','Demonstration records'],[projects.filter(project => project.status === 'draft').length,'Draft samples','Simulated status']].map(([value,label,note]) => <article key={label}><strong>{value}</strong><h2>{label}</h2><p>{note}</p></article>)}</div><div className="admin-overview-columns"><section><div className="admin-section-heading"><h2>Collections</h2><Link to="/admin/photos">Manage →</Link></div>{categories.map(category => <div className="admin-collection" key={category}><span>{category}</span><span>{photos.filter(photo => photo.category === category).length}</span></div>)}</section><section><h2>This session</h2><p className="admin-note">Local activity only. No server audit history is connected.</p>{changes.length ? <ol className="admin-history">{changes.map(change => <li key={change.id}><time>{change.time}</time>{change.message}</li>)}</ol> : <p>No simulated changes yet.</p>}</section></div></>} />
      <Route path="photos" element={<PhotoManager urls={urls} photos={photos} setPhotos={setPhotos} record={record} />} />
      <Route path="projects" element={<ProjectManager projects={projects} updateProjects={setProjects} record={record} />} />
      <Route path="uploads" element={<><p className="prototype-eyebrow">Before production</p><h1>Image preparation</h1><div className="admin-planning"><section><h2>1 / Validate</h2><p>Authenticated uploads only. Verify file signature, decoded dimensions and size server-side. Proposed limits: JPEG, PNG, WebP; 20 MB; 50 megapixels. Reject SVG and unsupported formats.</p></section><section><h2>2 / Preserve</h2><p>Store the original under a unique versioned identifier. Keep it private or access-controlled; remove GPS metadata from public derivatives.</p></section><section><h2>3 / Deliver</h2><p>Generate 320/640 px thumbnails and 960/1440/1920/2560 px display variants. Preserve aspect ratio, avoid upscaling and use automatic format and quality selection.</p></section><section><h2>4 / Replace safely</h2><p>Upload a new asset, validate derivatives, then atomically switch the reference. Retain the previous version for rollback; delete only after reference checks and a retention period.</p></section></div><p className="admin-note">Planning only. Local image controls do not compress, upload or delete Cloudinary assets.</p></>} />
      <Route path="*" element={<><h1>Workspace page not found</h1><Link to="/admin">Return to overview</Link></>} />
    </Routes></main></div>;
}
