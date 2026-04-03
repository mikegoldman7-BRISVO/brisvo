import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Bars3Icon,
  MusicalNoteIcon,
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/ui/carousel";
import { supabase } from "./lib/supabase";
import {
  AUDIO_UPLOAD_LIMIT_BYTES,
  DEMO_AUDIO_BUCKET,
  IMAGE_UPLOAD_LIMIT_BYTES,
  PROFILE_IMAGE_BUCKET,
  createDemoTitleFromFile,
  createStoragePath,
  deleteBucketObject,
  deleteBucketObjectConfirmed,
  deriveStoragePathFromPublicUrl,
  formatBytes,
  listBucketFolder,
  uploadFileWithProgress,
  validateAudioFile,
  validateImageFile,
} from "./lib/media";

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
const MIN_PASSWORD_LENGTH = 8;

const navigation = [{ name: "Dashboard", href: "#", current: true }];

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

function formatDateTime(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normaliseText(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

function getPhotoUploadTimestamp(file) {
  const parsed = Date.parse(file?.created_at || file?.updated_at || "");
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function sortDemos(demos = []) {
  return [...demos].sort((left, right) => {
    const sortOrderDelta = (left.sort_order ?? 0) - (right.sort_order ?? 0);
    if (sortOrderDelta !== 0) return sortOrderDelta;
    return (left.id ?? 0) - (right.id ?? 0);
  });
}

function prepareDemoDrafts(demos = []) {
  return sortDemos(demos).map((demo, index) => ({
    ...demo,
    name: normaliseText(demo.name || "") || createDemoTitleFromFile(getFileNameFromUrl(demo.file_url)),
    sort_order: index,
  }));
}

function areDemoDraftsEqual(left = [], right = []) {
  if (left.length !== right.length) return false;

  return left.every((draft, index) => {
    const source = right[index];

    return (
      draft.id === source.id &&
      draft.file_url === source.file_url &&
      (draft.sort_order ?? index) === (source.sort_order ?? index) &&
      normaliseText(draft.name || "") === normaliseText(source.name || "")
    );
  });
}

function getFileNameFromUrl(url = "") {
  if (!url) return "";

  try {
    const { pathname } = new URL(url);
    return decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return decodeURIComponent(url.split("/").pop() || "");
  }
}

function buildNotice(tone, message) {
  return { tone, message };
}

function logDashboardError(context, error) {
  if (import.meta.env.DEV) {
    console.error(context, error);
  }
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

function StatusNotice({ notice }) {
  if (!notice?.message) return null;

  const toneClassName =
    notice.tone === "error"
      ? "border-[#ff7a8b]/30 bg-[#2a1117] text-[#ffb4bf]"
      : notice.tone === "warning"
        ? "border-[#ffb400]/30 bg-[#231a08] text-[#ffd98a]"
        : "border-[#00c48c]/30 bg-[#00c48c]/10 text-[#b6ffe7]";

  return <div className={`rounded-[20px] border px-4 py-3 text-sm ${toneClassName}`}>{notice.message}</div>;
}

function ProgressCard({ title, fileName, progress }) {
  return (
    <div className="rounded-[22px] border border-[#ff667b]/28 bg-[#180e11] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff96a5]">{title}</div>
          <div className="mt-1 text-sm text-white">{fileName}</div>
        </div>
        <div className="text-sm font-semibold text-white">{progress}%</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#ff3d57] transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
      {...props}
    >
      {children}
    </button>
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
  const [photoLibrary, setPhotoLibrary] = useState([]);
  const [photoLibraryLoading, setPhotoLibraryLoading] = useState(false);
  const [photoNotice, setPhotoNotice] = useState(buildNotice("", ""));
  const [photoUploadState, setPhotoUploadState] = useState({ active: false, fileName: "", progress: 0 });
  const [photoBusyPath, setPhotoBusyPath] = useState("");
  const [photoDeletingPath, setPhotoDeletingPath] = useState("");
  const [demoDrafts, setDemoDrafts] = useState([]);
  const [demoNotice, setDemoNotice] = useState(buildNotice("", ""));
  const [demoSaving, setDemoSaving] = useState(false);
  const [demoUploadState, setDemoUploadState] = useState({ active: false, fileName: "", progress: 0 });
  const [demoDeletingId, setDemoDeletingId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordNotice, setPasswordNotice] = useState(buildNotice("", ""));
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileImageInputRef = useRef(null);
  const demoUploadInputRef = useRef(null);

  const artistName = artistProfile?.name || user?.user_metadata?.full_name || user?.email || "BrisVO Artist";
  const artistImage = artistProfile?.photo_url || null;
  const artistBio = normaliseText(artistProfile?.bio || "");
  const initials = getInitials(artistName);
  const categories = Array.isArray(artistProfile?.categories)
    ? artistProfile.categories
    : artistProfile?.categories
      ? [artistProfile.categories]
      : [];
  const liveDemos = prepareDemoDrafts(artistProfile?.demos || []);
  const liveDemosSerialized = JSON.stringify(liveDemos);
  const demosDirty = !areDemoDraftsEqual(demoDrafts, liveDemos);
  const lastSignIn = formatDate(session?.user?.last_sign_in_at);
  const joinedOn = formatDate(user?.created_at);
  const profileFolder = artistProfile?.id ? `${artistProfile.id}/profile` : "";
  const livePhotoItem = artistImage
    ? photoLibrary.find(file => file.publicUrl === artistImage) || {
        created_at: null,
        displayName: getFileNameFromUrl(artistImage),
        isManagedLibraryItem: false,
        metadata: null,
        name: getFileNameFromUrl(artistImage),
        path: "",
        publicUrl: artistImage,
        updated_at: null,
      }
    : null;
  const orderedPhotoLibrary = [...photoLibrary].sort(
    (left, right) => getPhotoUploadTimestamp(left) - getPhotoUploadTimestamp(right),
  );
  const photoCarouselItems = livePhotoItem
    ? [livePhotoItem, ...orderedPhotoLibrary.filter(file => file.publicUrl !== livePhotoItem.publicUrl)]
    : orderedPhotoLibrary;
  const currentPhotoIndex = Math.max(
    photoCarouselItems.findIndex(file => file.publicUrl === artistProfile?.photo_url),
    0,
  );

  useEffect(() => {
    setDemoDrafts(JSON.parse(liveDemosSerialized));
  }, [artistProfile?.id, liveDemosSerialized]);

  useEffect(() => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordNotice(buildNotice("", ""));
    setPasswordSaving(false);
  }, [user?.id]);

  const refreshPhotoLibrary = async ({ silent = false, throwOnError = false } = {}) => {
    if (!profileFolder) {
      setPhotoLibrary([]);
      return;
    }

    setPhotoLibraryLoading(true);

    try {
      const files = await listBucketFolder(PROFILE_IMAGE_BUCKET, profileFolder);
      setPhotoLibrary(files);

      if (!silent) {
        setPhotoNotice(current => (current.tone === "error" ? buildNotice("", "") : current));
      }
    } catch (error) {
      logDashboardError("Photo library refresh failed:", error);
      setPhotoNotice(buildNotice("error", "We couldn't load your stored profile images right now."));

      if (throwOnError) {
        throw error;
      }
    } finally {
      setPhotoLibraryLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPhotoLibrary = async () => {
      if (!profileFolder) {
        setPhotoLibrary([]);
        return;
      }

      setPhotoLibraryLoading(true);

      try {
        const files = await listBucketFolder(PROFILE_IMAGE_BUCKET, profileFolder);

        if (!cancelled) {
          setPhotoLibrary(files);
        }
      } catch (error) {
        logDashboardError("Initial photo library load failed:", error);
        if (!cancelled) {
          setPhotoNotice(buildNotice("error", "We couldn't load your stored profile images right now."));
        }
      } finally {
        if (!cancelled) {
          setPhotoLibraryLoading(false);
        }
      }
    };

    loadPhotoLibrary();

    return () => {
      cancelled = true;
    };
  }, [profileFolder]);

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

  const commitArtistProfile = nextData => {
    onArtistProfileChange?.({
      ...artistProfile,
      ...nextData,
      demos: artistProfile?.demos || [],
    });
  };

  const commitArtistDemos = nextDemos => {
    onArtistProfileChange?.({
      ...artistProfile,
      demos: prepareDemoDrafts(nextDemos),
    });
  };

  const updateArtistRecord = async payload => {
    const { data, error } = await supabase
      .from("artists")
      .update(payload)
      .eq("id", artistProfile.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    commitArtistProfile(data);
    return data;
  };

  const persistDemoDraftCollection = async nextDrafts => {
    const preparedDrafts = prepareDemoDrafts(nextDrafts).map((demo, index) => ({
      id: demo.id,
      artist_id: artistProfile.id,
      file_url: demo.file_url,
      name: normaliseText(demo.name || "") || createDemoTitleFromFile(getFileNameFromUrl(demo.file_url)),
      sort_order: index,
    }));

    if (preparedDrafts.length === 0) {
      commitArtistDemos([]);
      setDemoDrafts([]);
      return [];
    }

    const { data, error } = await supabase
      .from("demos")
      .upsert(preparedDrafts, { onConflict: "id" })
      .select("*");

    if (error) {
      throw error;
    }

    const nextDemos = prepareDemoDrafts(data || preparedDrafts);
    commitArtistDemos(nextDemos);
    setDemoDrafts(nextDemos);
    return nextDemos;
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

    try {
      await updateArtistRecord({
        name: normaliseText(form.name || ""),
        gender: normaliseText(form.gender || "") || null,
        categories: form.categories,
        bio: normaliseText(form.bio || "") || null,
      });

      setSaveMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      logDashboardError("Profile save failed:", error);
      setSaveError("We couldn't save your profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageUpload = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !artistProfile?.id) return;

    const validationMessage = validateImageFile(file);

    if (validationMessage) {
      setPhotoNotice(buildNotice("error", validationMessage));
      return;
    }

    const path = createStoragePath({ artistId: artistProfile.id, kind: "profile", fileName: file.name });
    let publicUrl = "";

    setPhotoNotice(buildNotice("", ""));
    setPhotoUploadState({ active: true, fileName: file.name, progress: 0 });

    try {
      publicUrl = await uploadFileWithProgress({
        bucket: PROFILE_IMAGE_BUCKET,
        path,
        file,
        onProgress: progress => setPhotoUploadState(current => ({ ...current, progress })),
      });
    } catch (error) {
      logDashboardError("Profile image storage upload failed:", error);
      setPhotoNotice(buildNotice("error", "We couldn't upload your profile picture. Please try again."));
      setPhotoUploadState({ active: false, fileName: "", progress: 0 });
      return;
    }

    try {
      await updateArtistRecord({ photo_url: publicUrl });
    } catch (error) {
      logDashboardError("Profile image artist update failed:", error);
      setPhotoNotice(buildNotice("error", "Your profile picture uploaded, but we couldn't attach it to your profile."));
      setPhotoUploadState({ active: false, fileName: "", progress: 0 });
      return;
    }

    try {
      await refreshPhotoLibrary({ silent: true, throwOnError: true });
      setPhotoNotice(buildNotice("success", "Profile picture uploaded and set live."));
    } catch (error) {
      logDashboardError("Profile image library refresh failed:", error);
      setPhotoNotice(buildNotice("warning", "Profile picture uploaded and set live, but refreshing the stored image library failed."));
    } finally {
      setPhotoUploadState({ active: false, fileName: "", progress: 0 });
    }
  };

  const handleUseStoredPhoto = async file => {
    if (!artistProfile?.id || photoBusyPath === file.path) return;

    setPhotoBusyPath(file.path);
    setPhotoNotice(buildNotice("", ""));

    try {
      await updateArtistRecord({ photo_url: file.publicUrl });
      setPhotoNotice(buildNotice("success", "Profile picture switched successfully."));
    } catch (error) {
      logDashboardError("Profile image switch failed:", error);
      setPhotoNotice(buildNotice("error", "We couldn't switch your profile picture. Please try again."));
    } finally {
      setPhotoBusyPath("");
    }
  };

  const handleDeleteStoredPhoto = async file => {
    if (!artistProfile?.id) return;

    const confirmed = window.confirm("Delete this stored image? If it is live on your profile it will be cleared first.");

    if (!confirmed) return;

    const previousLibrary = photoLibrary;
    const isCurrentPhoto = artistProfile?.photo_url === file.publicUrl;

    setPhotoDeletingPath(file.path);
    setPhotoNotice(buildNotice("", ""));
    setPhotoLibrary(current => current.filter(item => item.path !== file.path));

    try {
      if (isCurrentPhoto) {
        await updateArtistRecord({ photo_url: null });
      }

      const nextLibrary = await deleteBucketObjectConfirmed({
        bucket: PROFILE_IMAGE_BUCKET,
        path: file.path,
        folder: profileFolder,
      });

      setPhotoLibrary(nextLibrary);
      setPhotoNotice(buildNotice("success", "Stored image deleted."));
    } catch (error) {
      logDashboardError("Profile image delete failed:", error);
      setPhotoLibrary(previousLibrary);
      setPhotoNotice(buildNotice("error", "We couldn't delete that image. Please try again."));
    } finally {
      setPhotoDeletingPath("");
    }
  };

  const handleDemoNameChange = (demoId, value) => {
    setDemoDrafts(current =>
      current.map(demo => (demo.id === demoId ? { ...demo, name: value } : demo)),
    );
    setDemoNotice(buildNotice("", ""));
  };

  const updatePasswordField = key => event => {
    const value = event.target.value;
    setPasswordForm(current => ({ ...current, [key]: value }));
    setPasswordErrors(current => (current[key] ? { ...current, [key]: "" } : current));
    setPasswordNotice(buildNotice("", ""));
  };

  const handleChangePassword = async event => {
    event.preventDefault();

    if (!user?.email || passwordSaving) return;

    const nextErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = "Current password is required.";
    }

    if (!passwordForm.newPassword) {
      nextErrors.newPassword = "New password is required.";
    } else if (passwordForm.newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      nextErrors.newPassword = "Choose a new password that differs from your current one.";
    }

    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPasswordSaving(true);
    setPasswordNotice(buildNotice("", ""));

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (reauthError) {
        throw reauthError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setPasswordNotice(buildNotice("success", "Your password has been updated."));
    } catch (error) {
      logDashboardError("Password change failed:", error);
      setPasswordNotice(buildNotice("error", "We couldn't change your password. Check your details and try again."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleMoveDemo = (index, offset) => {
    setDemoDrafts(current => {
      const nextIndex = index + offset;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextDrafts = [...current];
      const [movedDemo] = nextDrafts.splice(index, 1);
      nextDrafts.splice(nextIndex, 0, movedDemo);
      const reorderedDrafts = nextDrafts.map((demo, order) => ({ ...demo, sort_order: order }));
      setDemoNotice(buildNotice("warning", "Demo order updated locally. Save demo changes to publish it."));
      return reorderedDrafts;
    });
  };

  const handleSaveDemoEdits = async () => {
    if (!artistProfile?.id || demoSaving || !demosDirty) return;

    setDemoSaving(true);
    setDemoNotice(buildNotice("", ""));

    try {
      await persistDemoDraftCollection(demoDrafts);
      setDemoNotice(buildNotice("success", "Demo titles and order saved."));
    } catch (error) {
      logDashboardError("Demo save failed:", error);
      setDemoNotice(buildNotice("error", "We couldn't save your demo changes. Please try again."));
    } finally {
      setDemoSaving(false);
    }
  };

  const handleDemoUpload = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !artistProfile?.id) return;

    const validationMessage = validateAudioFile(file);

    if (validationMessage) {
      setDemoNotice(buildNotice("error", validationMessage));
      return;
    }

    const path = createStoragePath({ artistId: artistProfile.id, kind: "demos", fileName: file.name });
    let publicUrl = "";

    setDemoNotice(buildNotice("", ""));
    setDemoUploadState({ active: true, fileName: file.name, progress: 0 });

    try {
      publicUrl = await uploadFileWithProgress({
        bucket: DEMO_AUDIO_BUCKET,
        path,
        file,
        onProgress: progress => setDemoUploadState(current => ({ ...current, progress })),
      });
    } catch (error) {
      logDashboardError("Demo storage upload failed:", error);
      setDemoNotice(buildNotice("error", "We couldn't upload your demo audio. Please try again."));
      setDemoUploadState({ active: false, fileName: "", progress: 0 });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("demos")
        .insert({
          artist_id: artistProfile.id,
          file_url: publicUrl,
          name: createDemoTitleFromFile(file.name),
          sort_order: demoDrafts.length,
        })
        .select("*")
        .single();

      if (error) {
        try {
          await deleteBucketObject(DEMO_AUDIO_BUCKET, path);
        } catch {
          // Best-effort cleanup only. The insert error remains the user-facing failure.
        }

        throw error;
      }

      const nextDemos = prepareDemoDrafts([...demoDrafts, data]);
      commitArtistDemos(nextDemos);
      setDemoDrafts(nextDemos);
      setDemoNotice(buildNotice("success", "Demo uploaded successfully."));
    } catch (error) {
      logDashboardError("Demo row insert failed:", error);
      setDemoNotice(buildNotice("error", "Your audio uploaded, but we couldn't add the demo to your profile."));
    } finally {
      setDemoUploadState({ active: false, fileName: "", progress: 0 });
    }
  };

  const handleDeleteDemo = async demo => {
    if (!artistProfile?.id || demoDeletingId === demo.id) return;

    const confirmed = window.confirm(`Delete "${demo.name}" from your demo list?`);

    if (!confirmed) return;

    setDemoDeletingId(demo.id);
    setDemoNotice(buildNotice("", ""));

    try {
      const { error } = await supabase.from("demos").delete().eq("id", demo.id);

      if (error) {
        throw error;
      }

      const remainingDrafts = prepareDemoDrafts(demoDrafts.filter(item => item.id !== demo.id));
      await persistDemoDraftCollection(remainingDrafts);

      const storagePath = deriveStoragePathFromPublicUrl(DEMO_AUDIO_BUCKET, demo.file_url);

      if (storagePath) {
        try {
          await deleteBucketObject(DEMO_AUDIO_BUCKET, storagePath);
          setDemoNotice(buildNotice("success", "Demo deleted."));
        } catch (storageError) {
          logDashboardError("Demo storage cleanup failed:", storageError);
          setDemoNotice(buildNotice("warning", `${demo.name} was removed from your profile, but its storage file could not be deleted automatically.`));
        }
      } else {
        setDemoNotice(buildNotice("success", "Demo deleted."));
      }
    } catch (error) {
      logDashboardError("Demo delete failed:", error);
      setDemoNotice(buildNotice("error", "We couldn't delete that demo. Please try again."));
    } finally {
      setDemoDeletingId(null);
    }
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
                    Review your live BrisVO profile details, manage reusable media assets, and keep your demos ready for clients and casting teams.
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

                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff96a5]">
                          Profile Photo
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                          Image library
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                          Upload fresh headshots, keep previous images available for reuse, and delete storage files you no longer want on hand.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <SecondaryButton onClick={() => profileImageInputRef.current?.click()} disabled={!artistProfile?.id || photoUploadState.active}>
                          <PhotoIcon className="size-4" />
                          Upload Photo
                        </SecondaryButton>
                        <SecondaryButton onClick={() => refreshPhotoLibrary()} disabled={!artistProfile?.id || photoLibraryLoading}>
                          <ArrowPathIcon className={classNames("size-4", photoLibraryLoading ? "animate-spin" : "")} />
                          Refresh Library
                        </SecondaryButton>
                      </div>
                    </div>

                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleProfileImageUpload}
                    />

                    <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/38">
                      JPEG, PNG, or WebP up to {formatBytes(IMAGE_UPLOAD_LIMIT_BYTES)}.
                    </div>

                    <div className="mt-5 space-y-4">
                      <StatusNotice notice={photoNotice} />
                      {photoUploadState.active && (
                        <ProgressCard title="Uploading profile image" fileName={photoUploadState.fileName} progress={photoUploadState.progress} />
                      )}
                    </div>

                    {!photoLibraryLoading && photoCarouselItems.length > 0 && (
                      <div className="mt-6">
                        <Carousel
                          key={`${photoCarouselItems.length}-${artistProfile?.photo_url || "no-photo"}`}
                          initialIndex={currentPhotoIndex}
                          className="mx-auto max-w-[28rem]"
                        >
                          <CarouselContent>
                            {photoCarouselItems.map(file => {
                              const isCurrent = artistProfile?.photo_url === file.publicUrl;
                              const canDelete = file.isManagedLibraryItem !== false;
                              const isSwitching = photoBusyPath === file.path;
                              const isDeleting = photoDeletingPath === file.path;

                              return (
                                <CarouselItem key={file.path || `current-photo-${file.publicUrl}`}>
                                  <div className="overflow-hidden rounded-[28px] bg-[#0d0d0d]">
                                    <div className="aspect-[4/5] bg-white/6">
                                      <img
                                        src={file.publicUrl}
                                        alt={file.displayName || file.name}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 truncate text-sm font-semibold text-white">
                                          {file.displayName || file.name}
                                        </div>
                                        {isCurrent && (
                                          <span className="shrink-0 rounded-full border border-[#00c48c]/30 bg-[#00c48c]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b6ffe7]">
                                            Live
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-3 text-xs leading-5 text-white/48">
                                        {canDelete
                                          ? `Added ${formatDateTime(file.created_at || file.updated_at)} · ${formatBytes(file.metadata?.size || 0)}`
                                          : "Currently live on your profile"}
                                      </div>
                                      <div className="mt-5 flex flex-wrap gap-2">
                                        <SecondaryButton
                                          onClick={() => handleUseStoredPhoto(file)}
                                          disabled={isCurrent || isSwitching || isDeleting}
                                          className={isCurrent ? "border-[#00c48c]/28 bg-[#00c48c]/10 text-[#b6ffe7]" : ""}
                                        >
                                          {isSwitching ? "Switching..." : isCurrent ? "Current Photo" : "Use Photo"}
                                        </SecondaryButton>
                                        <SecondaryButton
                                          onClick={() => handleDeleteStoredPhoto(file)}
                                          disabled={!canDelete || isSwitching || isDeleting}
                                          className="border-[#ff7a8b]/22 bg-[#251117] text-[#ffb4bf] hover:bg-[#33151d]"
                                        >
                                          <TrashIcon className="size-4" />
                                          {!canDelete ? "Managed Elsewhere" : isDeleting ? "Deleting..." : "Delete"}
                                        </SecondaryButton>
                                      </div>
                                    </div>
                                  </div>
                                </CarouselItem>
                              );
                            })}
                          </CarouselContent>

                          {photoCarouselItems.length > 1 && (
                            <div className="mt-4 flex items-center justify-between gap-4">
                              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/38">
                                {photoLibrary.length} stored photo{photoLibrary.length > 1 ? "s" : ""}
                              </div>
                              <div className="flex items-center gap-3">
                                <CarouselPrevious />
                                <CarouselNext />
                              </div>
                            </div>
                          )}
                        </Carousel>
                      </div>
                    )}

                    {!photoLibraryLoading && photoLibrary.length === 0 && (
                      <div className="mt-6 rounded-[24px] border border-dashed border-white/12 bg-black/18 px-5 py-10 text-center text-sm text-white/52">
                        No stored profile images yet. Upload your first image to start building the library.
                      </div>
                    )}

                    {photoLibraryLoading && (
                      <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-5 py-8 text-sm text-white/58">
                        Loading stored profile images...
                      </div>
                    )}
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
                          ? "Loading your artist profile..."
                          : artistError ||
                            artistBio ||
                            (artistProfile?.id
                              ? "No bio has been added to this artist profile yet."
                              : "Your profile will appear here once your BrisVO artist record is linked to this account.")}
                      </p>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff96a5]">
                          Account Security
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                          Change password
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                          Confirm your current password, then choose a new one for this BrisVO account.
                        </p>
                      </div>
                      <div className="text-xs uppercase tracking-[0.22em] text-white/38">
                        Minimum {MIN_PASSWORD_LENGTH} characters
                      </div>
                    </div>

                    <div className="mt-5">
                      <StatusNotice notice={passwordNotice} />
                    </div>

                    <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                          Current Password
                        </span>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={updatePasswordField("currentPassword")}
                          autoComplete="current-password"
                          className={classNames(
                            "w-full rounded-[22px] border bg-black/20 px-4 py-4 text-sm text-white outline-none transition",
                            passwordErrors.currentPassword
                              ? "border-[#ff7a8b] focus:border-[#ff7a8b]"
                              : "border-white/10 focus:border-[#ff3d57]/70",
                          )}
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-2 text-sm text-[#ff9daa]">{passwordErrors.currentPassword}</p>
                        )}
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                            New Password
                          </span>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={updatePasswordField("newPassword")}
                            autoComplete="new-password"
                            className={classNames(
                              "w-full rounded-[22px] border bg-black/20 px-4 py-4 text-sm text-white outline-none transition",
                              passwordErrors.newPassword
                                ? "border-[#ff7a8b] focus:border-[#ff7a8b]"
                                : "border-white/10 focus:border-[#ff3d57]/70",
                            )}
                          />
                          {passwordErrors.newPassword && (
                            <p className="mt-2 text-sm text-[#ff9daa]">{passwordErrors.newPassword}</p>
                          )}
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                            Confirm New Password
                          </span>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={updatePasswordField("confirmPassword")}
                            autoComplete="new-password"
                            className={classNames(
                              "w-full rounded-[22px] border bg-black/20 px-4 py-4 text-sm text-white outline-none transition",
                              passwordErrors.confirmPassword
                                ? "border-[#ff7a8b] focus:border-[#ff7a8b]"
                                : "border-white/10 focus:border-[#ff3d57]/70",
                            )}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="mt-2 text-sm text-[#ff9daa]">{passwordErrors.confirmPassword}</p>
                          )}
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <button
                          type="submit"
                          disabled={passwordSaving || !user?.email}
                          className="inline-flex items-center justify-center rounded-full border border-[#ff667b]/35 bg-[#ff3d57] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(255,61,87,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {passwordSaving ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff96a5]">
                          Demo Reels
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                          Track manager
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                          Upload MP3 demo tracks, rename them for the public modal, reorder them, and remove tracks you no longer want live.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <SecondaryButton onClick={() => demoUploadInputRef.current?.click()} disabled={!artistProfile?.id || demoUploadState.active}>
                          <MusicalNoteIcon className="size-4" />
                          Upload MP3
                        </SecondaryButton>
                        <SecondaryButton onClick={handleSaveDemoEdits} disabled={!demosDirty || demoSaving || demoUploadState.active || demoDeletingId !== null}>
                          <FloppyIcon className="size-4" />
                          {demoSaving ? "Saving..." : "Save Demo Changes"}
                        </SecondaryButton>
                      </div>
                    </div>

                    <input
                      ref={demoUploadInputRef}
                      type="file"
                      accept=".mp3,audio/mpeg"
                      className="hidden"
                      onChange={handleDemoUpload}
                    />

                    <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/38">
                      MP3 only, up to {formatBytes(AUDIO_UPLOAD_LIMIT_BYTES)} per file.
                    </div>

                    <div className="mt-5 space-y-4">
                      <StatusNotice notice={demoNotice} />
                      {demoUploadState.active && (
                        <ProgressCard title="Uploading demo track" fileName={demoUploadState.fileName} progress={demoUploadState.progress} />
                      )}
                    </div>

                    <div className="mt-6 space-y-4">
                      {demoDrafts.map((demo, index) => {
                        const isDeleting = demoDeletingId === demo.id;

                        return (
                          <div key={demo.id} className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/82">
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs uppercase tracking-[0.24em] text-white/38">
                                      Public track title
                                    </div>
                                    <input
                                      type="text"
                                      value={demo.name}
                                      onChange={event => handleDemoNameChange(demo.id, event.target.value)}
                                      disabled={demoSaving || isDeleting}
                                      className="mt-2 w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#ff3d57]/70 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/44">
                                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                    {getFileNameFromUrl(demo.file_url)}
                                  </span>
                                  <a
                                    href={demo.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/70 transition hover:text-white"
                                  >
                                    Preview file
                                  </a>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <SecondaryButton onClick={() => handleMoveDemo(index, -1)} disabled={index === 0 || demoSaving || isDeleting}>
                                  <ArrowUpIcon className="size-4" />
                                  Up
                                </SecondaryButton>
                                <SecondaryButton onClick={() => handleMoveDemo(index, 1)} disabled={index === demoDrafts.length - 1 || demoSaving || isDeleting}>
                                  <ArrowDownIcon className="size-4" />
                                  Down
                                </SecondaryButton>
                                <SecondaryButton
                                  onClick={() => handleDeleteDemo(demo)}
                                  disabled={demoSaving || isDeleting}
                                  className="border-[#ff7a8b]/22 bg-[#251117] text-[#ffb4bf] hover:bg-[#33151d]"
                                >
                                  <TrashIcon className="size-4" />
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </SecondaryButton>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {demoDrafts.length === 0 && (
                      <div className="mt-6 rounded-[24px] border border-dashed border-white/12 bg-black/18 px-5 py-10 text-center text-sm text-white/52">
                        No demo tracks yet. Upload an MP3 and it will appear in the artist modal once saved.
                      </div>
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
