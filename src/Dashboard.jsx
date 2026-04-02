import { useState } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "./lib/supabase";

const ACCENT = "#FF3D57";
const AVAILABLE_CATEGORIES = [
  "Corporate",
  "Commercial",
  "Character",
  "Retail",
  "Audiobook",
  "E-Learning",
  "Female",
  "Male",
  "IVR & On Hold",
  "Jingle",
];

const navigation = [
  { name: "Dashboard", href: "#", current: true },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{label}</div>
      <div className="mt-2 text-sm leading-6 text-white/84">{value || "Not provided yet"}</div>
    </div>
  );
}

function FloppyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h11l3 3v13H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v6h6V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-6h6v6" />
    </svg>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div
      className={classNames(
        "rounded-[22px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        accent ? "border-[#ff6a7e]/30 bg-[#ff3d57]/12" : "border-white/10 bg-black/20",
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{label}</div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">{value}</div>
    </div>
  );
}

export default function Dashboard({
  session,
  user,
  artistProfile,
  artistLoading = false,
  artistError = "",
  onArtistProfileChange,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: "",
    gender: "",
    categories: [],
    bio: "",
  });

  const artistName = artistProfile?.name || user?.user_metadata?.full_name || user?.email || "BrisVO Artist";
  const artistImage = artistProfile?.photo_url || null;
  const initials = getInitials(artistName);
  const categories = Array.isArray(artistProfile?.categories)
    ? artistProfile.categories
    : artistProfile?.categories
      ? [artistProfile.categories]
      : [];
  const lastSignIn = formatDate(session?.user?.last_sign_in_at);
  const joinedOn = formatDate(user?.created_at);
  const resetFormFromProfile = () => {
    setForm({
      name: artistProfile?.name || "",
      gender: artistProfile?.gender || "",
      categories,
      bio: artistProfile?.bio || "",
    });
  };

  const updateField = key => event => {
    const value = event.target.value;
    setForm(current => ({ ...current, [key]: value }));
    setSaveMessage("");
    setSaveError("");
  };

  const toggleCategory = categoryToToggle => {
    setForm(current => ({
      ...current,
      categories: current.categories.includes(categoryToToggle)
        ? current.categories.filter(category => category !== categoryToToggle)
        : [...current.categories, categoryToToggle],
    }));
    setSaveMessage("");
    setSaveError("");
  };

  const handleCancelEdit = () => {
    resetFormFromProfile();
    setSaveMessage("");
    setSaveError("");
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    resetFormFromProfile();
    setSaveMessage("");
    setSaveError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!artistProfile?.id || isSaving) return;

    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    const payload = {
      name: form.name.trim(),
      gender: form.gender.trim() || null,
      categories: form.categories,
      bio: form.bio.trim() || null,
    };

    const { data, error } = await supabase
      .from("artists")
      .update(payload)
      .eq("id", artistProfile.id)
      .select("*")
      .single();

    if (error) {
      setIsSaving(false);
      setSaveError(error.message || "Failed to save profile changes.");
      return;
    }

    onArtistProfileChange?.(data);
    setSaveMessage("Profile updated successfully.");
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <>
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="relative overflow-hidden bg-[#080808] pb-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,61,87,0.16),transparent_32%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
          <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#FF3D57]/16 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-[#7C3AED]/14 blur-3xl" />

          <Disclosure as="nav" className="relative border-b border-white/10 bg-transparent backdrop-blur-sm">
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between px-4 sm:px-0">
                <div className="flex items-center gap-10">
                  <div className="shrink-0">
                    <div className="brand-mark text-lg tracking-[0.12em] text-white">
                      Bris<span style={{ color: ACCENT }}>VO</span>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className="flex items-baseline space-x-2">
                      {navigation.map(item => (
                        <a
                          key={item.name}
                          href={item.href}
                          aria-current={item.current ? "page" : undefined}
                          className={classNames(
                            item.current
                              ? "border border-white/12 bg-white/[0.08] text-white"
                              : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                            "rounded-full px-4 py-2 text-sm font-medium transition",
                          )}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    {/* <button
                      type="button"
                      className="relative rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition hover:text-white"
                    >
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">View notifications</span>
                      <BellIcon aria-hidden="true" className="size-5" />
                    </button> */}

                    <Menu as="div" className="relative ml-3">
                      <MenuButton className="relative flex max-w-xs items-center rounded-full border border-white/10 bg-white/[0.04] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF3D57]">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        {artistImage ? (
                          <img
                            alt={artistName}
                            src={artistImage}
                            className="size-8 rounded-full object-cover outline -outline-offset-1 outline-white/10"
                          />
                        ) : (
                          <div
                            className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ background: `linear-gradient(145deg, ${artistProfile?.brand_color || ACCENT}, rgba(255,255,255,0.16))` }}
                          >
                            {initials}
                          </div>
                        )}
                      </MenuButton>

                      <MenuItems
                        transition
                        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-2xl border border-white/10 bg-[#111111] py-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] outline-hidden transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                      >
                        <div className="border-b border-white/10 px-4 py-3">
                          <div className="text-sm font-semibold text-white">{artistName}</div>
                          <div className="mt-1 text-xs text-white/52">{user?.email}</div>
                        </div>
                        <MenuItem>
                          <button
                            type="button"
                            onClick={onLogout}
                            className="block w-full px-4 py-2 text-left text-sm text-[#ff9cab] data-focus:bg-white/[0.05] data-focus:text-white data-focus:outline-hidden"
                          >
                            Log out
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>
                </div>

                <div className="-mr-2 flex md:hidden">
                  <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] p-2 text-white/65 hover:bg-white/[0.07] hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#FF3D57]">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                    <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                  </DisclosureButton>
                </div>
              </div>
            </div>

            <DisclosurePanel className="border-b border-white/10 bg-[#0a0a0a]/95 md:hidden">
              <div className="space-y-1 px-2 py-3 sm:px-3">
                {navigation.map(item => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                      "block rounded-xl px-3 py-2 text-base font-medium",
                    )}
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 pb-3">
                <div className="flex items-center px-5">
                  <div className="shrink-0">
                    {artistImage ? (
                      <img
                        alt={artistName}
                        src={artistImage}
                        className="size-10 rounded-full object-cover outline -outline-offset-1 outline-white/10"
                      />
                    ) : (
                      <div
                        className="flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ background: `linear-gradient(145deg, ${artistProfile?.brand_color || ACCENT}, rgba(255,255,255,0.16))` }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base/5 font-medium text-white">{artistName}</div>
                    <div className="text-sm font-medium text-white/45">{user?.email}</div>
                  </div>
                  {/* <button
                    type="button"
                    className="relative ml-auto shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/65 hover:text-white"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-5" />
                  </button> */}
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <DisclosureButton
                    as="button"
                    type="button"
                    onClick={onLogout}
                    className="block w-full rounded-xl px-3 py-2 text-left text-base font-medium text-[#ff9cab] hover:bg-white/[0.05] hover:text-white"
                  >
                    Log out
                  </DisclosureButton>
                </div>
              </div>
            </DisclosurePanel>
          </Disclosure>

          <header className="relative py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff96a5]">
                    Artist workspace
                  </div>
                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Dashboard
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
                    Review your live BrisVO profile details, confirm your presentation, and keep your artist page ready for clients and casting teams.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center rounded-full border border-[#ff667b]/35 bg-[#ff3d57] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,61,87,0.32)] transition hover:brightness-110"
                >
                  Log Out
                </button>
              </div>
            </div>
          </header>
        </div>

        <main className="relative -mt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#101010]/92 px-5 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] outline outline-1 -outline-offset-1 outline-white/6 backdrop-blur-xl sm:px-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
                <section id="artist-profile" className="space-y-6">
                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
                    <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
                      <div className="min-h-[340px]">
                        {artistImage ? (
                          <img
                            alt={artistName}
                            src={artistImage}
                            className="h-full w-full object-cover"
                            style={{ objectPosition: "top center" }}
                          />
                        ) : (
                          <div
                            className="flex h-full min-h-[340px] items-center justify-center text-6xl font-semibold text-white"
                            style={{ background: `linear-gradient(145deg, ${artistProfile?.brand_color || ACCENT}, rgba(255,255,255,0.08))` }}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between border-t border-white/10 p-5 lg:border-t-0 lg:border-l">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/45">
                            Artist Profile
                          </div>
                          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">{artistName}</h2>
                          <p className="mt-2 text-sm leading-6 text-white/62">
                            {artistProfile?.gender ? `${artistProfile.gender} voice artist` : "BrisVO account"}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {categories.length > 0 ? (
                              categories.map(category => (
                                <span
                                  key={category}
                                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72"
                                >
                                  {category}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                                Categories pending
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <StatCard label="Last Sign In" value={lastSignIn} />
                          <StatCard label="Joined BrisVO" value={joinedOn} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="account" className="space-y-6">
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff96a5]">
                          Artist Data
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                          Profile details
                        </h3>
                      </div>
                      {artistProfile?.id && (
                        <div className="flex items-center gap-3">
                          {isEditing && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-sm font-medium text-white/52 transition hover:text-white"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={isEditing ? handleSave : handleStartEdit}
                            disabled={artistLoading || isSaving}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isEditing ? (
                              <>
                                <FloppyIcon className="size-4" />
                                {isSaving ? "Saving..." : "Save"}
                              </>
                            ) : (
                              <>
                                <PencilSquareIcon className="size-4" />
                                Edit
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {saveError && (
                      <div className="mt-5 rounded-[20px] border border-[#ff7a8b]/30 bg-[#2a1117] px-4 py-3 text-sm text-[#ffb4bf]">
                        {saveError}
                      </div>
                    )}
                    {saveMessage && (
                      <div className="mt-5 rounded-[20px] border border-[#00c48c]/30 bg-[#00c48c]/10 px-4 py-3 text-sm text-[#b6ffe7]">
                        {saveMessage}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="mt-6 space-y-4">
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                            Display Name
                          </span>
                          <input
                            type="text"
                            value={form.name}
                            onChange={updateField("name")}
                            className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-[#ff3d57]/70"
                          />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                              Email
                            </span>
                            <input
                              type="text"
                              value={user?.email || ""}
                              readOnly
                              className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60 outline-none"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                              Gender
                            </span>
                            <select
                              value={form.gender}
                              onChange={updateField("gender")}
                              className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition focus:border-[#ff3d57]/70"
                            >
                              <option value="" className="bg-[#111111]">Select gender</option>
                              <option value="Male" className="bg-[#111111]">Male</option>
                              <option value="Female" className="bg-[#111111]">Female</option>
                            </select>
                          </label>
                        </div>

                        <div>
                          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                            Categories
                          </span>
                          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_CATEGORIES.map(category => {
                                const selected = form.categories.includes(category);

                                return (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className={classNames(
                                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
                                      selected
                                        ? "border-[#ff667b]/35 bg-[#ff3d57] text-white shadow-[0_10px_24px_rgba(255,61,87,0.22)]"
                                        : "border-white/10 bg-white/[0.06] text-white/74 hover:bg-white/[0.1]",
                                    )}
                                  >
                                    {category}
                                    {selected && <XMarkIcon className="size-3.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <ProfileRow label="Display Name" value={artistProfile?.name || artistName} />
                        <ProfileRow label="Email" value={user?.email} />
                        <ProfileRow label="Gender" value={artistProfile?.gender} />
                        <ProfileRow
                          label="Categories"
                          value={categories.length > 0 ? categories.join(", ") : ""}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,61,87,0.14),rgba(255,255,255,0.04))] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Bio</div>
                    {isEditing ? (
                      <textarea
                        value={form.bio}
                        onChange={updateField("bio")}
                        rows={8}
                        className="mt-4 w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-[#ff3d57]/70"
                        placeholder="Write a concise professional bio for your BrisVO profile."
                      />
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-white/76">
                        {artistLoading
                          ? "Loading your artist profile…"
                          : artistError || artistProfile?.bio || "Your profile will appear here once your BrisVO artist record is linked to this account."}
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
