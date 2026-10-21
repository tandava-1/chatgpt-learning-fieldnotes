import type { Week } from './types';
import { api } from './storage';
import { ui, format, starterIdeas } from './curriculum.js';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Compass, Download, Feather, FlaskConical, LayoutDashboard, LockKeyhole, Menu, Plus, Search, Settings, Signal, Sparkles, TrendingUp, X, Copy, ExternalLink, RotateCcw, Leaf, CheckCircle2 } from 'lucide-react';
import { weeks, seedResources, writingSeeds, dayLabels, dayMinutes, taskFor, tutorPrompt, briefingPrompt, } from './curriculum.js';
type Rec = {
    kind: string;
    key: string;
    value: any;
    updatedAt: string;
};
type Submission = {
    id: string;
    week: number;
    answer: string;
    status: string;
    feedback: string | null;
    created_at: string;
    evaluated_at?: string;
};
type Data = {
    records: Rec[];
    submissions: Submission[];
    aiReady: boolean;
    model: string | null;
};
type Page = string;
const pages: {
    name: Page;
    icon: any;
}[] = [{ name: ui["today"], icon: LayoutDashboard }, { name: ui["journey"], icon: Compass }, { name: ui["exercises"], icon: FlaskConical }, { name: ui["library"], icon: BookOpen }, { name: ui["writing"], icon: Feather }, { name: ui["signal_desk"], icon: Signal }, { name: ui["progress"], icon: TrendingUp }];
const empty: Data = { records: [], submissions: [], aiReady: false, model: null };
function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function addDays(d: string, n: number) { const a = new Date(d + ui["t12_00_00z"]); a.setUTCDate(a.getUTCDate() + n); return a.toISOString().slice(0, 10); }
function niceDate(d: string) { return new Date(d.length === 10 ? d + ui["t12_00_00z"] : d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }); }
function safeLink(s: string) {
    try {
        return ['https:', 'http:'].includes(new URL(s).protocol) ? s : '#';
    }
    catch {
        return '#';
    }
}
function exportFile(name: string, content: string, type = 'text/plain') { const u = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
const Ctx = createContext<any>(null);
const useStudio = () => useContext(Ctx);
export default function Studio() {
    const [data, setData] = useState<Data>(empty), [page, setPage] = useState<Page>(ui["today"]), [selectedWeek, setSelectedWeek] = useState(1), [ready, setReady] = useState(false), [error, setError] = useState(''), [toast, setToast] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [mobile, setMobile] = useState(false);
    const saving = useRef(false);
    const rec = (kind: string, key: string, fallback: any = null) => data.records.find(r => r.kind === kind && r.key === key)?.value ?? fallback;
    const settings = rec('settings', 'main', { startDate: today(), project: ui["community_garden_planner"], weeklyGoal: 300 });
    const elapsed = Math.floor((Date.parse(today()) - Date.parse(settings.startDate)) / 86400000), currentWeek = Math.min(weeks.length, Math.max(1, Math.floor(Math.max(0, elapsed) / 7) + 1)), currentDay = Math.max(0, elapsed) % 7;
    const current = weeks[currentWeek - 1];
    useEffect(() => {
        api('/api/state').then(d => {
            setData(d);
            const s = d.records.find((r: Rec) => r.kind === 'settings')?.value;
            const day = Math.floor((Date.parse(today()) - Date.parse(s?.startDate || today())) / 86400000);
            setSelectedWeek(Math.min(weeks.length, Math.max(1, Math.floor(Math.max(0, day) / 7) + 1)));
            const hash = decodeURIComponent(location.hash.slice(1));
            if ([...pages.map(p => p.name), ui["settings"]].includes(hash))
                setPage(hash as Page);
            setReady(true);
        }).catch(e => setError(e.message));
    }, []);
    useEffect(() => {
        if (!dirty)
            return;
        const fn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', fn);
        return () => window.removeEventListener('beforeunload', fn);
    }, [dirty]);
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(''), 4200);
        return () => clearTimeout(t);
    }, [toast]);
    function navigate(p: Page, w?: number) {
        if (dirty && !window.confirm(ui["you_have_unsaved_changes_leave_this_view"]))
            return;
        setDirty(false);
        if (w)
            setSelectedWeek(w);
        setPage(p);
        location.hash = encodeURIComponent(p);
        setMobile(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    async function save(kind: string, key: string, value: any, remove = false) {
        if (saving.current)
            return false;
        saving.current = true;
        setBusy(true);
        try {
            const r = await api('/api/state', { kind, key, value, remove });
            setData(d => ({ ...d, records: [...d.records.filter(v => !(v.kind === kind && v.key === key)), ...(remove ? [] : [{ kind, key, value, updatedAt: r.updatedAt }])] }));
            setToast(remove ? ui["removed_from_your_workspace"] : ui["saved_in_this_browser"]);
            return true;
        }
        catch (e: any) {
            setError(e.message);
            return false;
        }
        finally {
            saving.current = false;
            setBusy(false);
        }
    }
    const done = (w: number, d: number) => !!rec('task', `w${w}-d${d}`)?.done;
    const doneCount = (w: number) => dayMinutes.filter((m, d) => m > 0 && done(w, d)).length;
    const allDone = weeks.reduce((sum, w) => sum + doneCount(w.id), 0);
    const resources = [...seedResources.map(r => ({ ...r, ...rec('resource', r.id, {}) })), ...data.records.filter(r => r.kind === 'resource' && !seedResources.some(s => s.id === r.key)).map(r => ({ id: r.key, ...r.value }))];
    const writings = [...writingSeeds.map(r => ({ ...r, ...rec('writing', r.id, {}) })), ...data.records.filter(r => r.kind === 'writing' && !writingSeeds.some(s => s.id === r.key)).map(r => ({ id: r.key, ...r.value }))];
    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setToast(ui["copied_paste_into_your_preferred_ai_learning_conversation"]);
        }
        catch {
            setError(ui["clipboard_access_was_unavailable_please_copy_the_text_manually"]);
        }
    }
    const ctx = { data, setData, rec, save, done, doneCount, allDone, settings, current, currentWeek, currentDay, selectedWeek, setSelectedWeek, navigate, resources, writings, busy, dirty, setDirty, setError, setToast, copy };
    return <Ctx.Provider value={ctx}><div className={`app-shell ${page === 'Exercises' || page === 'Writing' ? 'study-calm' : ''}`} data-page={page}><aside className={`sidebar ${mobile ? 'open' : ''}`}><a className="brand" href="#Today" onClick={e => { e.preventDefault(); navigate(ui["today"]); }}><span className="brand-mark"><Leaf size={23}/></span><span>{ui["fieldnotes"]}<span className="brand-dot">{ui["symbol"]}</span></span></a><div className="workspace-label">{ui["your_ai_learning_studio"]}</div><nav aria-label={ui["main_navigation"]}>{pages.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? 'active' : ''}`} aria-current={page === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={18}/>{name}{name === ui["journey"] && <span className="nav-count">{weeks.length}</span>}</button>)}</nav><div className="side-bottom"><div className="side-progress"><span>{ui["small_steps_better_judgment"]}</span><div className="bar"><i style={{ width: `${allDone / (weeks.length * 6) * 100}%` }}/></div><small>{allDone}{ui["of"]}{weeks.length * 6}{ui["learning_tasks_complete"]}</small></div><button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => navigate(ui["settings"])}><Settings size={18}/>{ui["workspace_settings"]}</button><div className="profile"><span className="avatar">{ui["fl"]}</span><div><strong>{ui["learner"]}</strong><small>{ui["curious_always_learning"]}</small></div><LockKeyhole size={14}/></div></div></aside><div className="main-wrap"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label={ui["toggle_menu"]} onClick={() => setMobile(!mobile)}><Menu size={20}/></button><span>{ui["learning_studio"]}</span><ChevronRight size={13}/><strong>{page}</strong></div><div className="top-meta"><span className="private"><LockKeyhole size={12}/>{ui["browser_local_workspace"]}</span><span className="top-date">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}</span></div></header><main>{error && <div className="error" role="alert"><span>{error}</span><button className="icon-button" aria-label={ui["dismiss_error"]} onClick={() => setError('')}><X size={16}/></button></div>}{!ready ? <div className="loading"><Leaf size={32}/><h2>{ui["opening_your_fieldnotes"]}</h2><p>{ui["your_learning_in_one_place"]}</p>{error && <button className="button" onClick={() => location.reload()}>{ui["try_again"]}</button>}</div> : <>{page === ui["today"] && <Today elapsed={elapsed}/>} {page === ui["journey"] && <Journey />}{page === ui["exercises"] && <Exercises key={selectedWeek}/>} {page === ui["library"] && <Library />}{page === ui["writing"] && <Writing />}{page === ui["signal_desk"] && <Signals />}{page === ui["progress"] && <Progress />}{page === ui["settings"] && <WorkspaceSettings />}</>}</main><footer>{ui["think_clearly_test_your_beliefs_leave_a_trail"]}<span>{ui["made_for_the_long_game"]}</span></footer></div>{toast && <div className="toast" role="status"><CheckCircle2 size={17}/>{toast}</div>}</div></Ctx.Provider>;
}
function Heading({ eyebrow, title, description, action }: {
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Tag({ children, tone = '' }: {
    children: ReactNode;
    tone?: string;
}) { return <span className={`tag ${tone}`}>{children}</span>; }
function WeekPicker() {
    const { selectedWeek, setSelectedWeek, dirty, setDirty } = useStudio();
    return <label className="week-picker">{ui["week"]}<select aria-label={ui["choose_week"]} value={selectedWeek} onChange={e => {
            if (dirty && !confirm(ui["leave_unsaved_changes"]))
                return;
            setDirty(false);
            setSelectedWeek(+e.target.value);
        }}>{weeks.map(w => <option key={w.id} value={w.id}>{String(w.id).padStart(2, '0')}{ui["symbol_2"]}{w.title}</option>)}</select></label>;
}
function TaskRow({ w, d, highlight = false }: {
    w: Week;
    d: number;
    highlight?: boolean;
}) { const { done, save, navigate, busy, settings } = useStudio(); const task = taskFor(w, d), complete = done(w.id, d); return <div className={`task-row ${complete ? 'complete' : ''} ${highlight ? 'highlight' : ''}`}><button className="check-button" aria-label={format(ui["0_1"], complete ? ui["reopen"] : ui["complete"], task.title)} aria-pressed={complete} disabled={busy} onClick={() => save('task', `w${w.id}-d${d}`, { done: !complete, completedAt: complete ? null : new Date().toISOString() })}>{complete && <Check size={15}/>}</button><div className="task-body"><div className="task-type">{ui["day"]}{d + 1}{ui["symbol_2"]}{niceDate(addDays(settings.startDate, (w.id - 1) * 7 + d))}{ui["symbol_2"]}{dayLabels[d]}</div><button className="task-title" onClick={() => navigate(task.target as Page, w.id)}>{task.title}</button><p>{task.detail}</p></div><span className="duration"><Clock size={12}/>{dayMinutes[d]}{ui["min"]}</span><button className="icon-button task-arrow" aria-label={format(ui["open_0"], task.title)} onClick={() => navigate(task.target as Page, w.id)}><ArrowUpRight size={18}/></button></div>; }
function Today({ elapsed }: {
    elapsed: number;
}) { const { current: w, currentWeek, currentDay, doneCount, allDone, resources, navigate, data, settings } = useStudio(); const weekDone = doneCount(currentWeek), next = elapsed < 0 ? 0 : currentDay; return <><section className="hero cloud-hero" aria-labelledby="welcome-title"><img className="cloud-landscape" src={import.meta.env.BASE_URL + "cloud-garden.webp"} alt={ui["symbol_3"]} width="1536" height="1024" fetchPriority="high"/><div className="hero-copy"><div className="hero-meta"><span>{ui["week_2"]}{String(w.id).padStart(2, '0')}{ui["symbol_4"]}{w.phase.toUpperCase()}</span></div><h1 id="welcome-title">{ui["a_little_curiosity"]}<br />{ui["goes_a_long_way"]}</h1><p className="hero-welcome">{ui["welcome_back_a_little_space_to_learn"]}<br className="desktop-break"/>{ui["experiment_and_see_things_differently"]}</p><span className="lesson-label">{ui["today_s_chapter"]}</span><h2>{w.title}</h2><p className="hero-concepts">{w.concepts}</p><button className="button" onClick={() => navigate(ui["journey"], w.id)}>{ui["continue_learning"]}<ArrowRight size={16}/></button></div><div className="hero-bottom"><span>{ui["your_through_line"]}</span><strong>{settings.project}</strong></div></section><section className="stats-grid"><Stat label={ui["this_week"]} value={`${weekDone}/6`} detail={ui["learning_tasks_complete_2"]}/><Stat label={ui["journey_so_far"]} value={`${Math.round(allDone / (weeks.length * 6) * 100)}%`} detail={ui["of_your_12_week_plan"]}/><Stat label={ui["practice_collected"]} value={data.submissions.length} detail={ui["exercise_submissions"]}/><Stat label={ui["ideas_in_the_library"]} value={resources.length} detail={ui["resources_to_return_to"]}/></section><div className="dashboard-grid"><div><div className="section-title"><h2>{ui["your_next_session"]}</h2><Tag>{elapsed < 0 ? ui["starts"] + niceDate(settings.startDate) : elapsed >= weeks.length * 7 ? ui["plan_complete_revisit_anytime"] : format(ui["day_0_1_min"], next + 1, dayMinutes[next])}</Tag></div><section className="panel task-panel"><TaskRow w={w} d={next} highlight/>{next === 6 ? <div className="panel-note">{ui["a_little_space_is_part_of_the_plan_catch_up_in_journey_whenever_y"]}</div> : <div className="panel-note">{ui["answer_first_then_learn_test_and_revise_your_view"]}</div>}</section><div className="section-title spaced"><h2>{ui["the_week_at_a_glance"]}</h2><button className="text-button" onClick={() => navigate(ui["journey"], w.id)}>{ui["view_plan"]}<ArrowRight size={14}/></button></div><div className="week-strip">{dayLabels.map((d, i) => <button key={d} onClick={() => navigate(taskFor(w, i).target as Page, w.id)} className={`${i === next ? 'today' : ''}`}><small>{ui["d"]}{i + 1}</small><span>{d}</span><DayStatus w={w.id} d={i}/></button>)}</div><div className="question-note"><span className="eyebrow">{ui["keep_this_question_open"]}</span><p>{ui["symbol_5"]}{w.question}{ui["symbol_6"]}</p><button className="text-button" onClick={() => navigate(ui["exercises"], w.id)}>{ui["put_your_thinking_on_paper"]}<ArrowRight size={14}/></button></div></div><div><div className="section-title"><h2>{ui["on_your_bookshelf"]}</h2><BookOpen size={17}/></div><div className="panel reading-list">{resources.filter((r: any) => w.resourceIds.includes(r.id)).slice(0, 2).map((r: any) => <a href={safeLink(r.url)} target="_blank" rel="noreferrer" className="reading-item" key={r.id}><span className="resource-icon"><BookOpen size={20}/></span><Tag>{r.type}</Tag><h3>{r.title} <ArrowUpRight size={15}/></h3><p>{r.notes}</p></a>)}<button className="text-button" onClick={() => navigate(ui["library"])}>{ui["explore_your_library"]}<ArrowRight size={14}/></button></div><div className="rhythm-note"><Leaf size={20}/><h3>{ui["consistency_over_intensity"]}</h3><p>{ui["five_focused_hours_a_week_a_useful_experiment_a_belief_you_re_wil"]}</p><small>{ui["busy_week_use_the_90_minute_minimum_question_experiment_reflectio"]}</small></div></div></div></>; }
function DayStatus({ w, d }: {
    w: number;
    d: number;
}) { const { done } = useStudio(); return done(w, d) ? <CheckCircle2 size={16}/> : <span className="day-circle"/>; }
function Stat({ label, value, detail }: {
    label: string;
    value: string | number;
    detail: string;
}) { return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Journey() {
    const { selectedWeek, navigate, doneCount, rec, save, busy, setDirty } = useStudio();
    const w = weeks[selectedWeek - 1];
    const [note, setNote] = useState(rec('note', `week-${w.id}`, { text: '' }).text);
    useEffect(() => { setNote(rec('note', `week-${w.id}`, { text: '' }).text); }, [w.id]);
    return <><Heading eyebrow={ui["the_big_picture"]} title={ui["twelve_weeks_a_different_way_to_think"]} description={ui["build_understanding_through_decisions_evidence_and_the_willingnes"]}/><div className="journey-layout"><div className="curriculum-list">{weeks.map(v => <button key={v.id} className={`curriculum-week ${v.id === w.id ? 'active' : ''}`} onClick={() => navigate(ui["journey"], v.id)}><span>{String(v.id).padStart(2, '0')}</span><div><small>{v.phase}</small><strong>{v.title}</strong><div className="bar"><i style={{ width: `${doneCount(v.id) / 6 * 100}%` }}/></div></div>{doneCount(v.id) === 6 ? <Check size={15}/> : <ChevronRight size={15}/>}</button>)}</div><div><section className="panel week-intro"><div className="section-title"><Tag tone="green">{ui["week_2"]}{String(w.id).padStart(2, '0')}</Tag><span className="muted">{doneCount(w.id)}{ui["6_complete_5_hours"]}</span></div><h2>{w.title}</h2><p className="concepts">{w.concepts}</p><div className="lesson">{w.lesson.map((s, i) => <div key={s}><span>{ui["0"]}{i + 1}</span><p>{s}</p></div>)}</div><div className="deliverable"><FlaskConical size={20}/><div><small>{ui["this_week_s_deliverable"]}</small><strong>{w.deliverable}</strong></div><button className="text-button" onClick={() => navigate(ui["exercises"], w.id)}>{ui["open_exercise"]}<ArrowRight size={14}/></button></div></section><div className="section-title spaced"><h2>{ui["your_daily_plan"]}</h2><small className="muted">{ui["flexible_pace_nothing_gets_locked"]}</small></div><section className="panel task-panel">{dayLabels.map((_, d) => <TaskRow key={`${w.id}-${d}`} w={w} d={d}/>)}</section><section className="panel notes-panel"><h3>{ui["your_week"]}{w.id}{ui["fieldnotes_2"]}</h3><p className="muted">{ui["three_useful_ideas_one_open_question_and_anything_you_want_to_rem"]}</p><textarea aria-label={ui["weekly_notes"]} placeholder={ui["what_did_you_notice"]} value={note} onChange={e => { setNote(e.target.value); setDirty(true); }} rows={6}/><button className="button" disabled={busy} onClick={async () => {
            if (await save('note', `week-${w.id}`, { text: note }))
                setDirty(false);
        }}>{ui["save_notes"]}</button></section></div></div></>;
}
function Exercises() {
    const { selectedWeek, data, setData, rec, save, busy, setDirty, setToast, setError, copy } = useStudio();
    const w = weeks[selectedWeek - 1];
    const [answer, setAnswer] = useState(rec('note', `exercise-${w.id}`, { text: '' }).text), [working, setWorking] = useState(false), [openId, setOpenId] = useState('');
    const history = data.submissions.filter((s: Submission) => s.week === w.id);
    async function submit() {
        setWorking(true);
        try {
            const s = await api('/api/submissions', { week: w.id, answer });
            setData((d: Data) => ({ ...d, submissions: [s, ...d.submissions] }));
            setDirty(false);
            setOpenId(s.id);
            setToast(ui["submission_saved_your_earlier_attempts_are_preserved"]);
        }
        catch (e: any) {
            setError(e.message);
        }
        finally {
            setWorking(false);
        }
    }
    return <><Heading eyebrow={ui["the_practice_room"]} title={ui["make_your_thinking_visible"]} description={ui["a_clear_answer_is_useful_an_honest_revision_is_even_better"]} action={<WeekPicker />}/><div className="exercise-layout"><div><section className="panel exercise-brief"><Tag tone="green">{ui["week_2"]}{w.id}{ui["symbol_2"]}{w.phase}</Tag><h2>{w.title}</h2><p className="exercise-prompt">{w.exercise}</p><div className="deliverable"><FlaskConical size={18}/><span>{w.deliverable}</span></div></section><section className="panel editor-panel"><div className="section-title"><h3>{ui["your_response"]}</h3><span className="muted">{answer.trim() ? answer.trim().split(/\s+/).length : 0}{ui["words"]}</span></div><textarea aria-label={ui["exercise_response"]} rows={15} placeholder={ui["my_initial_judgment_the_assumptions_i_m_making_what_i_tested_or_w"]} value={answer} onChange={e => { setAnswer(e.target.value); setDirty(true); }} maxLength={20000}/><div className="editor-actions"><button className="button secondary" disabled={busy || working} onClick={async () => {
            if (await save('note', `exercise-${w.id}`, { text: answer }))
                setDirty(false);
        }}>{ui["save_draft"]}</button><button className="button" disabled={working || busy || answer.trim().length < 40} onClick={submit}>{working ? ui["working"] : ui["submit_exercise"]}<ArrowRight size={16}/></button></div><small className="muted">{ui["submit_saves_a_dated_snapshot_in_this_browser_use_the_tutor_promp"]}</small></section><div className="section-title spaced"><h2>{ui["your_attempts"]}</h2><Tag>{history.length}{ui["saved"]}</Tag></div>{!history.length ? <Empty title={ui["your_first_attempt_belongs_here"]} description={ui["you_don_t_need_a_perfect_answer_submit_your_current_reasoning_the"]}/> : history.map((s: Submission) => {
            const feedback = s.feedback ? JSON.parse(s.feedback) : null;
            return <section className="panel attempt" key={s.id}><button className="attempt-toggle" onClick={() => setOpenId(openId === s.id ? '' : s.id)}><div><strong>{niceDate(s.created_at)}{ui["symbol_2"]}{new Date(s.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}</strong><small>{feedback ? ui["feedback_available"] : ui["submitted_saved_locally"]}</small></div><ChevronRight size={18} className={openId === s.id ? 'rotated' : ''}/></button>{openId === s.id && <div className="attempt-body"><p className="preserve">{s.answer}</p>{feedback ? <Feedback f={feedback}/> : <><div className="notice">{data.aiReady ? ui["your_answer_will_be_sent_to_the_configured_ai_provider_for_feedba"] : ui["your_attempt_is_saved_locally_copy_the_tutor_prompt_and_share_you"]}</div><button className="button" onClick={() => copy(tutorPrompt(w) + ui["symbol_7"] + s.answer)}><Copy size={16}/>{ui["copy_attempt_for_review"]}</button></>}<button className="text-button revision-button" onClick={() => {
                        if (answer && answer !== s.answer && !confirm(ui["replace_the_current_editor_with_this_saved_attempt"]))
                            return;
                        setAnswer(s.answer);
                        setDirty(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}><RotateCcw size={14}/>{ui["revise_this_attempt"]}</button></div>}</section>;
        })}</div><aside><section className="panel rubric"><span className="eyebrow">{ui["what_good_thinking_looks_like"]}</span><h3>{ui["the_feedback_rubric"]}</h3>{[ui["conceptual_clarity"], ui["evidence_and_testing"], ui["product_judgment"], ui["intellectual_honesty"]].map((r, i) => <div className="rubric-row" key={r}><span>{ui["0"]}{i + 1}</span><div><strong>{r}</strong><p>{[ui["explain_the_concept_accurately_in_your_own_words"], ui["use_observations_or_propose_a_test_that_could_prove_you_wrong"], ui["connect_tradeoffs_to_users_costs_and_real_world_outcomes"], ui["name_assumptions_uncertainty_and_the_limits_of_your_evidence"]][i]}</p></div></div>)}<p className="fine-print">{ui["each_dimension_is_scored_0_4_scores_are_learning_feedback_not_cer"]}</p></section><section className="socratic-card"><Sparkles size={22}/><h3>{ui["think_it_through_one_question_at_a_time"]}</h3><p>{w.question}</p><button className="button secondary" onClick={() => copy(tutorPrompt(w))}><Copy size={15}/>{ui["copy_tutor_prompt"]}</button><small>{ui["paste_into_your_preferred_ai_assistant_for_a_live_socratic_conver"]}</small></section>{!data.aiReady && <div className="notice"><strong>{ui["bring_your_own_learning_conversation"]}</strong><p>{ui["use_the_tutor_prompt_above_this_static_edition_does_not_accept_ap"]}</p></div>}</aside></div></>;
}
function Feedback({ f }: {
    f: any;
}) { return <div className="feedback"><div className="section-title"><h3><Sparkles size={17}/>{ui["ai_feedback"]}</h3><Tag tone="green">{ui["formative_review"]}</Tag></div><p>{f.summary}</p><div className="feedback-grid">{f.criteria.map((c: any) => <div key={c.name}><span>{c.name}</span><strong>{c.score}<small>{ui["4"]}</small></strong><p>{c.feedback}</p></div>)}</div><h4>{ui["keep_doing"]}</h4><ul>{f.strengths.map((v: string) => <li key={v}>{v}</li>)}</ul><h4>{ui["develop_next"]}</h4><ul>{f.improvements.map((v: string) => <li key={v}>{v}</li>)}</ul><div className="question-note"><span className="eyebrow">{ui["your_next_question"]}</span><p>{f.question}</p></div><p><strong>{ui["small_next_experiment"]}</strong> {f.nextExperiment}</p><small className="muted">{ui["model"]}{f.model || ui["configured_evaluator"]}{ui["verify_factual_claims_independently"]}</small></div>; }
function Empty({ title, description }: {
    title: string;
    description: string;
}) { return <div className="empty panel"><Leaf size={25}/><h3>{title}</h3><p>{description}</p></div>; }
function Modal({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { ref.current?.showModal(); }, []); return <dialog ref={ref} className="modal" onCancel={e => { e.preventDefault(); onClose(); }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label={ui["close_dialog"]}><X size={19}/></button></div>{children}</dialog>; }
function Library() {
    const { resources, save, busy, setDirty, dirty } = useStudio();
    const [search, setSearch] = useState(''), [filter, setFilter] = useState(ui["all"]), [edit, setEdit] = useState<any>(null);
    const list = resources.filter((r: any) => (filter === ui["all"] || r.type === filter) && format(ui["0_1"], r.title, r.notes).toLowerCase().includes(search.toLowerCase()));
    const close = () => {
        if (dirty && !confirm(ui["discard_unsaved_resource_changes"]))
            return;
        setDirty(false);
        setEdit(null);
    };
    return <><Heading eyebrow={ui["your_reference_shelf"]} title={ui["collect_what_changes_your_thinking"]} description={ui["articles_videos_courses_and_your_own_takeaways_curated_for_use_no"]} action={<button className="button" onClick={() => setEdit({ id: crypto.randomUUID(), title: '', url: '', type: ui["article"], week: 0, status: ui["saved_2"], notes: '' })}><Plus size={16}/>{ui["add_resource"]}</button>}/><div className="filter-bar"><label className="search-box"><Search size={17}/><input aria-label={ui["search_resources"]} placeholder={ui["search_your_library"]} value={search} onChange={e => setSearch(e.target.value)}/></label><div className="filter-tabs">{[ui["all"], ui["article"], ui["video"], ui["course"], ui["paper"], ui["tool"]].map(f => <button className={filter === f ? 'active' : ''} key={f} onClick={() => setFilter(f)}>{f}</button>)}</div></div><div className="resource-grid">{list.map((r: any) => <article className="panel resource-card" key={r.id}><div className="resource-card-top"><span className={`resource-visual ${r.type === 'Course' ? 'peach' : r.type === 'Video' ? 'lavender' : ''}`}><BookOpen size={25}/></span><Tag tone={r.status === ui["completed"] ? 'green' : ''}>{r.status}</Tag></div><small className="eyebrow">{r.type}{ui["symbol_2"]}{r.week ? format(ui["week_0"], r.week) : ui["ongoing"]}</small><h2>{r.title}</h2><p>{r.notes || ui["add_a_takeaway_after_your_first_read"]}</p><div className="resource-actions"><a className="text-button" href={safeLink(r.url)} target="_blank" rel="noreferrer">{ui["open_resource"]}<ArrowUpRight size={15}/></a><button className="text-button muted" onClick={() => setEdit({ ...r })}>{ui["notes_status"]}</button></div></article>)}</div>{!list.length && <Empty title={ui["a_little_room_on_the_shelf"]} description={ui["add_a_resource_or_try_a_different_search"]}/>}{edit && <Modal title={ui["resource_details"]} onClose={close}><form onSubmit={async (e) => {
                e.preventDefault();
                const { id, ...value } = edit;
                if (await save('resource', id, value)) {
                    setDirty(false);
                    setEdit(null);
                }
            }}><Field label={ui["title"]}><input required maxLength={240} value={edit.title} onChange={e => { setEdit({ ...edit, title: e.target.value }); setDirty(true); }}/></Field><Field label={ui["link"]}><input type="url" required placeholder={ui["https"]} value={edit.url} onChange={e => { setEdit({ ...edit, url: e.target.value }); setDirty(true); }}/></Field><div className="form-grid"><Field label={ui["format"]}><select value={edit.type} onChange={e => { setEdit({ ...edit, type: e.target.value }); setDirty(true); }}>{[ui["article"], ui["video"], ui["course"], ui["paper"], ui["tool"]].map(v => <option key={v}>{v}</option>)}</select></Field><Field label={ui["status"]}><select value={edit.status} onChange={e => { setEdit({ ...edit, status: e.target.value }); setDirty(true); }}>{[ui["saved_2"], ui["in_progress"], ui["completed"]].map(v => <option key={v}>{v}</option>)}</select></Field></div><Field label={ui["related_week"]}><select value={edit.week} onChange={e => { setEdit({ ...edit, week: +e.target.value }); setDirty(true); }}><option value={0}>{ui["ongoing_any_week"]}</option>{weeks.map(w => <option key={w.id} value={w.id}>{ui["week"]}{w.id}{ui["symbol_2"]}{w.title}</option>)}</select></Field><Field label={ui["your_notes_and_takeaways"]}><textarea rows={5} maxLength={12000} value={edit.notes} onChange={e => { setEdit({ ...edit, notes: e.target.value }); setDirty(true); }}/></Field><div className="editor-actions">{!seedResources.some(s => s.id === edit.id) && <button className="text-button danger" type="button" disabled={busy} onClick={async () => {
                    if (confirm(ui["delete_this_saved_resource"]) && await save('resource', edit.id, null, true)) {
                        setDirty(false);
                        setEdit(null);
                    }
                }}>{ui["delete_resource"]}</button>}<button className="button" disabled={busy}>{busy ? ui["saving"] : ui["save_resource"]}</button></div></form></Modal>}</>;
}
function Field({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Writing() {
    const { writings, save, busy, setDirty, dirty } = useStudio();
    const [edit, setEdit] = useState<any>(null);
    function open(w: any) {
        if (dirty && !confirm(ui["leave_unsaved_writing"]))
            return;
        setDirty(false);
        setEdit({ ...w });
    }
    if (edit)
        return <><button className="text-button back-link" onClick={() => {
                if (dirty && !confirm(ui["leave_unsaved_writing"]))
                    return;
                setDirty(false);
                setEdit(null);
            }}><ChevronLeft size={15}/>{ui["all_writing"]}</button><Heading eyebrow={ui["write_to_understand"]} title={ui["let_the_evidence_shape_the_story"]} description={ui["keep_the_first_draft_yours_be_specific_about_what_you_learned_and"]}/><section className="panel writing-editor"><Field label={ui["working_title"]}><input value={edit.title} maxLength={240} onChange={e => { setEdit({ ...edit, title: e.target.value }); setDirty(true); }}/></Field><div className="form-grid"><Field label={ui["stage"]}><select value={edit.status} onChange={e => { setEdit({ ...edit, status: e.target.value }); setDirty(true); }}>{[ui["idea"], ui["drafting"], ui["ready"], ui["published"]].map(v => <option key={v}>{v}</option>)}</select></Field><Field label={ui["publish_after"]}><select value={edit.week} onChange={e => { setEdit({ ...edit, week: +e.target.value }); setDirty(true); }}>{weeks.map(w => <option key={w.id} value={w.id}>{ui["week"]}{w.id}</option>)}</select></Field></div><Field label={ui["draft"]}><textarea className="essay-text" rows={22} maxLength={60000} value={edit.text} onChange={e => { setEdit({ ...edit, text: e.target.value }); setDirty(true); }}/></Field><Field label={ui["published_link_optional"]}><input type="url" placeholder={ui["https"]} value={edit.url} onChange={e => { setEdit({ ...edit, url: e.target.value }); setDirty(true); }}/></Field><div className="editor-actions"><button className="button secondary" onClick={() => exportFile(`fieldnotes-essay-week-${edit.week}.md`, format(ui["0_1_2"], edit.title, edit.text))}><Download size={15}/>{ui["export_markdown"]}</button><button className="button" disabled={busy || !edit.title.trim()} onClick={async () => {
                const { id, ...v } = edit;
                if (await save('writing', id, v))
                    setDirty(false);
            }}>{busy ? ui["saving"] : ui["save_writing"]}</button></div><small className="muted">{ui["published_tracks_an_article_you_published_elsewhere_this_workspac"]}</small></section></>;
    return <><Heading eyebrow={ui["learn_in_public"]} title={ui["from_an_open_question_to_an_original_idea"]} description={ui["one_private_note_a_week_one_evidence_backed_essay_every_two_weeks"]} action={<button className="button" onClick={() => open({ id: crypto.randomUUID(), title: ui["untitled_learning_note"], text: '', week: 1, status: ui["idea"], url: '' })}><Plus size={16}/>{ui["new_writing"]}</button>}/><div className="writing-philosophy"><Feather size={24}/><p><strong>{ui["your_initial_belief_your_experiment_your_revised_view"]}</strong><br />{ui["write_to_make_your_reasoning_inspectable_you_don_t_need_to_sound_"]}</p></div><div className="writing-list">{writings.map((w: any) => <button className="panel writing-row" key={w.id} onClick={() => open(w)}><span className="essay-week">{ui["w"]}{String(w.week).padStart(2, '0')}</span><div><small>{w.status === ui["published"] ? ui["a_public_record_of_your_learning"] : ui["your_next_piece"]}</small><h2>{w.title}</h2><p>{w.status === ui["idea"] ? ui["a_starting_point_make_it_your_own"] : format(ui["0_words_in_your_draft"], w.text.trim().split(/\s+/).filter(Boolean).length)}</p></div><Tag tone={w.status === ui["published"] ? 'green' : ''}>{w.status}</Tag><ArrowUpRight size={20}/></button>)}</div></>;
}
function Signals() {
    const { data, save, busy, copy, setError, setDirty, dirty } = useStudio();
    const [items, setItems] = useState<any[]>([]), [loading, setLoading] = useState(false), [fetched, setFetched] = useState(''), [feedErrors, setFeedErrors] = useState<string[]>([]), [edit, setEdit] = useState<any>(null);
    const saved = data.records.filter((r: Rec) => r.kind === 'signal');
    const close = () => {
        if (dirty && !confirm(ui["discard_this_unsaved_development_card"]))
            return;
        setDirty(false);
        setEdit(null);
    };
    return <><Heading eyebrow={ui["less_noise_more_perspective"]} title={ui["what_changed_why_it_matters"]} description={ui["a_45_minute_weekly_habit_look_for_shifts_in_capability_reliabilit"]}/><div className="signal-intro"><div className="panel"><Tag tone="peach">{ui["the_weekly_filter"]}</Tag><h2>{ui["three_developments_one_useful_experiment"]}</h2><p>{ui["read_an_original_source_explain_the_change_in_plain_language_dist"]}</p><button className="text-button" onClick={() => copy(briefingPrompt)}>{ui["copy_beginner_friendly_briefing_prompt"]}<Copy size={14}/></button></div><div className="panel source-list"><h3>{ui["your_source_shortlist"]}</h3>{[[ui["the_batch"], 'https://www.deeplearning.ai/the-batch/'], [ui["anthropic_engineering"], 'https://www.anthropic.com/engineering'], [ui["openai_news"], 'https://openai.com/news/'], [ui["google_ai"], 'https://blog.google/technology/ai/']].map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={16}/></a>)}</div></div><div className="section-title spaced"><h2>{ui["from_the_source"]}</h2><small className="muted">{fetched ? format(ui["fetched_0_1_ist"], niceDate(fetched), new Date(fetched).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })) : ui["visit_a_source_then_capture_what_you_learned"]}</small></div>{feedErrors.length > 0 && <div className="notice">{ui["could_not_read"]}{feedErrors.join(ui["and"])}{ui["use_the_source_links_above_no_substitute_headlines_have_been_gene"]}</div>}{!items.length ? <Empty title={ui["an_intentional_pause_before_the_news"]} description={ui["open_the_sources_above_for_current_news_capture_a_development_car"]}/> : <div className="headline-list">{items.map((s, i) => <article className="panel headline" key={s.url + i}><span className="headline-number">{String(i + 1).padStart(2, '0')}</span><div><small className="eyebrow">{s.source}{ui["symbol_2"]}{s.date ? niceDate(s.date) : ui["date_unavailable"]}</small><h3><a href={safeLink(s.url)} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={14}/></a></h3></div><button className="text-button" onClick={() => setEdit({ id: crypto.randomUUID(), title: s.title, url: s.url, summary: ui["what_changed_explain_it_simply_evidence_and_limitations_why_it_ma"], decision: ui["monitor"], date: today() })}><Plus size={15}/>{ui["capture"]}</button></article>)}</div>}<div className="section-title spaced"><h2>{ui["your_development_cards"]}</h2><button className="text-button" onClick={() => setEdit({ id: crypto.randomUUID(), title: '', url: '', summary: '', decision: ui["monitor"], date: today() })}><Plus size={15}/>{ui["add_a_card"]}</button></div>{saved.length ? <div className="resource-grid">{saved.map((r: Rec) => <button className="panel signal-card" key={r.key} onClick={() => setEdit({ id: r.key, ...r.value })}><Tag tone="green">{r.value.decision}</Tag><h3>{r.value.title}</h3><p>{r.value.summary.slice(0, 180)}</p><small>{niceDate(r.value.date)}{ui["open_your_notes"]}</small></button>)}</div> : <p className="muted">{ui["your_interpretations_belong_here_save_a_card_to_begin"]}</p>}{edit && <Modal title={ui["a_development_worth_thinking_about"]} onClose={close}><form onSubmit={async (e) => {
                e.preventDefault();
                const { id, ...v } = edit;
                if (await save('signal', id, v)) {
                    setDirty(false);
                    setEdit(null);
                }
            }}><Field label={ui["title"]}><input required maxLength={240} value={edit.title} onChange={e => { setEdit({ ...edit, title: e.target.value }); setDirty(true); }}/></Field><Field label={ui["original_source"]}><input type="url" required value={edit.url} onChange={e => { setEdit({ ...edit, url: e.target.value }); setDirty(true); }}/></Field><Field label={ui["your_explanation_evidence_and_implications"]}><textarea rows={10} maxLength={12000} value={edit.summary} onChange={e => { setEdit({ ...edit, summary: e.target.value }); setDirty(true); }}/></Field><Field label={ui["your_next_action"]}><select value={edit.decision} onChange={e => { setEdit({ ...edit, decision: e.target.value }); setDirty(true); }}>{[ui["ignore"], ui["monitor"], ui["test"]].map(x => <option key={x}>{x}</option>)}</select></Field><button className="button" disabled={busy}>{ui["save_development_card"]}</button></form></Modal>}</>;
}
function Progress() {
    const { data, doneCount, allDone, resources, writings, save, busy, setDirty } = useStudio();
    const [entry, setEntry] = useState({ belief: '', evidence: '', revision: '', next: '', date: today() });
    const journal = data.records.filter((r: Rec) => r.kind === 'journal').sort((a: Rec, b: Rec) => b.updatedAt.localeCompare(a.updatedAt));
    const completedWeeks = weeks.filter(w => doneCount(w.id) === 6).length;
    return <><Heading eyebrow={ui["evidence_of_growth"]} title={ui["keep_a_record_of_changing_your_mind"]} description={ui["measure_practice_useful_outputs_and_revised_beliefs_completion_is"]}/><div className="stats-grid"><Stat label={ui["learning_tasks"]} value={`${allDone}/${weeks.length * 6}`} detail={format(ui["0_weeks_fully_completed"], completedWeeks)}/><Stat label={ui["exercises_submitted"]} value={data.submissions.length} detail={format(ui["0_with_ai_feedback"], data.submissions.filter((s: Submission) => s.feedback).length)}/><Stat label={ui["resources_completed"]} value={resources.filter((r: any) => r.status === ui["completed"]).length} detail={ui["read_watched_or_studied"]}/><Stat label={ui["articles_published"]} value={writings.filter((w: any) => w.status === ui["published"]).length} detail={ui["marked_published_by_you"]}/></div><section className="panel progress-panel"><div className="section-title"><h2>{ui["your_twelve_week_practice"]}</h2><span className="muted">{ui["completed_tasks_6_per_week"]}</span></div><div className="progress-chart">{weeks.map(w => <div key={w.id}><span>{doneCount(w.id)}{ui["6"]}</span><div className="chart-track"><i style={{ height: `${doneCount(w.id) / 6 * 100}%` }}/></div><small>{ui["w"]}{w.id}</small></div>)}</div></section><div className="reflection-layout"><section className="panel editor-panel"><h2>{ui["a_belief_worth_revisiting"]}</h2><p className="muted">{ui["use_this_weekly_or_whenever_an_experiment_surprises_you"]}</p><form onSubmit={async (e) => {
            e.preventDefault();
            if (await save('journal', crypto.randomUUID(), entry)) {
                setEntry({ belief: '', evidence: '', revision: '', next: '', date: today() });
                setDirty(false);
            }
        }}>{[['belief', ui["what_did_you_initially_believe"]], ['evidence', ui["what_did_you_observe_or_test"]], ['revision', ui["what_do_you_believe_now_and_why"]], ['next', ui["what_remains_uncertain_what_will_you_do_next"]]].map(([key, label]) => <Field key={key} label={label}><textarea rows={3} required={key === 'belief' || key === 'revision'} maxLength={6000} value={(entry as any)[key]} onChange={e => { setEntry({ ...entry, [key]: e.target.value }); setDirty(true); }}/></Field>)}<button className="button" disabled={busy}>{ui["save_reflection"]}<ArrowRight size={15}/></button></form></section><div><div className="section-title"><h2>{ui["your_learning_trail"]}</h2><Tag>{journal.length}{ui["reflections"]}</Tag></div>{journal.length ? journal.map((r: Rec) => <article className="panel reflection" key={r.key}><small className="eyebrow">{niceDate(r.value.date)}</small><h3>{r.value.belief}</h3><p><strong>{ui["evidence"]}</strong> {r.value.evidence || ui["not_recorded"]}</p><p><strong>{ui["revised_view"]}</strong> {r.value.revision}</p><p><strong>{ui["next"]}</strong> {r.value.next || ui["not_recorded"]}</p></article>) : <Empty title={ui["your_thinking_will_leave_a_trail"]} description={ui["save_your_first_reflection_over_time_these_become_the_most_useful"]}/>}<div className="checkpoint"><h3>{ui["checkpoints_weeks_4_8_and_12"]}</h3><p>{ui["try_an_unfamiliar_scenario_explain_the_concept_defend_a_decision_"]}</p><small>{ui["use_your_exercise_history_to_compare_reasoning_over_time_don_t_re"]}</small></div></div></div></>;
}
function WorkspaceSettings() {
    const { settings, save, busy, setDirty, data } = useStudio();
    const [form, setForm] = useState({ ...settings });
    return <><Heading eyebrow={ui["make_this_yours"]} title={ui["a_workspace_that_follows_your_pace"]} description={ui["adjust_your_start_date_choose_your_through_line_and_keep_a_copy_o"]}/><div className="settings-layout"><section className="panel editor-panel"><h2>{ui["your_learning_plan"]}</h2><form onSubmit={async (e) => {
            e.preventDefault();
            if (await save('settings', 'main', form))
                setDirty(false);
        }}><Field label={ui["journey_start_date"]}><input type="date" required value={form.startDate} onChange={e => { setForm({ ...form, startDate: e.target.value }); setDirty(true); }}/></Field><small className="muted">{ui["days_and_weeks_follow_your_browser_s_time_zone_changing_the_date_"]}</small><Field label={ui["your_recurring_product_problem"]}><input required maxLength={300} value={form.project} onChange={e => { setForm({ ...form, project: e.target.value }); setDirty(true); }}/></Field><Field label={ui["fictional_starter_ideas"]}><select aria-label={ui["fictional_starter_ideas"]} value={starterIdeas.includes(form.project) ? form.project : ""} onChange={e => { if (e.target.value) {
        setForm({ ...form, project: e.target.value });
        setDirty(true);
    } }}><option value="">{ui["choose_a_starter_or_keep_your_own"]}</option>{starterIdeas.map(idea => <option key={idea}>{idea}</option>)}</select></Field><button className="button" disabled={busy}>{ui["save_settings"]}</button></form></section><div><section className="panel settings-card"><div className="section-title"><h2>{ui["ai_learning_companion"]}</h2><Tag tone={data.aiReady ? 'green' : 'peach'}>{data.aiReady ? ui["configured"] : ui["copy_and_paste_tutoring"]}</Tag></div><p>{data.aiReady ? format(ui["your_evaluator_uses_0"], data.model) : ui["use_copy_tutor_prompt_in_exercises_to_start_a_conversation_with_y"]}</p><p>{ui["this_public_edition_has_no_api_connection_or_server_never_put_api"]}</p><small>{ui["nothing_is_sent_to_an_ai_provider_by_this_app_you_choose_what_to_"]}</small></section><section className="panel settings-card"><h2>{ui["your_work_is_yours"]}</h2><p>{ui["download_your_saved_tasks_notes_resources_articles_reflections_an"]}</p><button className="button secondary" onClick={() => exportFile(`fieldnotes-backup-${today()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, ...data, curriculum: weeks, starterResources: seedResources, writingPrompts: writingSeeds }, null, 2), 'application/json')}><Download size={16}/>{ui["export_learning_journey"]}</button><small>{ui["this_is_a_download_only_backup_import_is_not_part_of_this_version"]}</small></section><section className="panel settings-card"><LockKeyhole size={21}/><h3>{ui["private_by_default"]}</h3><p>{ui["your_work_is_saved_only_in_this_browser_on_this_device_anyone_usi"]}</p></section></div></div></>;
}
