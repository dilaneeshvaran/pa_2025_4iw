<template>
  <div class="flex h-full flex-col bg-gray-900">
    <!-- top bar -->
    <div
      class="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-green-600"
        >
          <Video class="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-white">
            {{ session.roomName }}
          </h2>
          <p class="text-xs text-gray-400">
            <span
              v-if="callStatus === 'connected'"
              class="flex items-center gap-1"
            >
              <span class="h-2 w-2 rounded-full bg-green-500" />
              En cours · {{ callDuration }}
            </span>
            <span
              v-else-if="callStatus === 'connecting'"
              class="flex items-center gap-1"
            >
              <span class="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              Connexion en cours...
            </span>
            <span v-else class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-gray-500" />
              En attente de l'autre participant
            </span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- connection quality -->
        <div
          v-if="callStatus === 'connected'"
          class="flex items-center gap-1 rounded-full bg-gray-700 px-3 py-1"
        >
          <Wifi :class="connectionQualityColor" class="h-3.5 w-3.5" />
          <span class="text-xs text-gray-300">{{
            connectionQualityLabel
          }}</span>
        </div>
        <button
          class="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          @click="toggleChat"
        >
          <MessageSquare class="h-5 w-5" />
          <span
            v-if="unreadMessages > 0"
            class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
          >
            {{ unreadMessages }}
          </span>
        </button>
      </div>
    </div>

    <!-- main content -->
    <div class="relative flex flex-1 overflow-hidden">
      <!-- video area -->
      <div class="relative flex-1">
        <!-- remote video (full) -->
        <div class="flex h-full items-center justify-center bg-gray-900">
          <video
            v-show="remoteStream"
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="h-full w-full object-contain"
          />
          <div v-if="!remoteStream" class="text-center">
            <div
              v-if="joinError"
              class="mx-auto max-w-sm rounded-lg bg-red-900/50 p-6"
            >
              <div
                class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-800"
              >
                <PhoneOff class="h-8 w-8 text-red-300" />
              </div>
              <p class="text-lg font-medium text-red-300">
                Impossible de rejoindre
              </p>
              <p class="mt-2 text-sm text-red-400">
                {{ joinError }}
              </p>
              <button
                class="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                @click="retryJoin"
              >
                Réessayer
              </button>
            </div>
            <template v-else>
              <div
                class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-800"
              >
                <User class="h-12 w-12 text-gray-500 dark:text-gray-400" />
              </div>
              <p class="text-lg font-medium text-gray-400">
                {{
                  callStatus === "waiting"
                    ? "En attente de l'autre participant..."
                    : "Connexion en cours..."
                }}
              </p>
              <p
                v-if="callStatus === 'waiting'"
                class="mt-2 text-sm text-gray-500 dark:text-gray-400"
              >
                L'autre participant rejoindra bientôt la consultation
              </p>
              <button
                v-if="callStatus === 'waiting'"
                class="mt-3 rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-orange-600"
                @click="reannounceJoin"
              >
                Relancer la connexion
              </button>
            </template>
          </div>
        </div>

        <!-- local video (pip) -->
        <div
          class="absolute bottom-4 right-4 overflow-hidden rounded-lg border-2 border-gray-700 shadow-lg"
          :class="localVideoExpanded ? 'h-48 w-64' : 'h-32 w-44'"
        >
          <video
            v-show="localStream && !videoMuted"
            ref="localVideoRef"
            autoplay
            muted
            playsinline
            class="h-full w-full object-cover"
          />
          <div
            v-if="!localStream || videoMuted"
            class="flex h-full w-full items-center justify-center bg-gray-800"
          >
            <VideoOff class="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <button
            class="absolute right-1 top-1 rounded bg-black/50 p-1 text-white/70 hover:text-white"
            @click="localVideoExpanded = !localVideoExpanded"
          >
            <Maximize2 v-if="!localVideoExpanded" class="h-3 w-3" />
            <Minimize2 v-else class="h-3 w-3" />
          </button>
        </div>

        <!-- screen share indicator -->
        <div
          v-if="isScreenSharing"
          class="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-white shadow-lg"
        >
          <Monitor class="h-4 w-4" />
          <span class="text-sm font-medium">Partage d'écran en cours</span>
          <button
            class="ml-2 rounded-full bg-orange-600 p-0.5 hover:bg-orange-600"
            @click="stopScreenShare"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- chat sidebar -->
      <Transition name="slide">
        <div
          v-if="chatOpen"
          class="flex w-80 flex-col border-l border-gray-700 bg-gray-800"
        >
          <div
            class="flex items-center justify-between border-b border-gray-700 px-4 py-3"
          >
            <h3 class="text-sm font-semibold text-white">Messages</h3>
            <button
              class="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              @click="chatOpen = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div
            ref="chatContainerRef"
            class="flex-1 space-y-3 overflow-y-auto p-4"
          >
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              :class="[
                'max-w-[85%] rounded-lg px-3 py-2',
                msg.fromSelf
                  ? 'ml-auto bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-200',
              ]"
            >
              <p class="text-sm">{{ msg.text }}</p>
              <p
                :class="[
                  'mt-1 text-[10px]',
                  msg.fromSelf ? 'text-orange-200' : 'text-gray-400',
                ]"
              >
                {{ msg.time }}
              </p>
            </div>
            <div
              v-if="chatMessages.length === 0"
              class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              Pas encore de messages
            </div>
          </div>
          <div class="border-t border-gray-700 p-3">
            <div class="flex gap-2">
              <input
                v-model="chatInput"
                type="text"
                placeholder="Votre message..."
                class="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                @keyup.enter="sendChatMessage"
              />
              <button
                class="rounded-lg bg-orange-500 px-3 py-2 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                :disabled="!chatInput.trim()"
                @click="sendChatMessage"
              >
                <Send class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- bottom controls -->
    <div
      class="flex items-center justify-center gap-3 border-t border-gray-700 bg-gray-800 px-4 py-4"
    >
      <button
        :class="[
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
          audioMuted
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-700 text-white hover:bg-gray-600',
        ]"
        :title="audioMuted ? 'Activer le micro' : 'Couper le micro'"
        @click="toggleAudio"
      >
        <MicOff v-if="audioMuted" class="h-5 w-5" />
        <Mic v-else class="h-5 w-5" />
      </button>

      <button
        :class="[
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
          videoMuted
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-700 text-white hover:bg-gray-600',
        ]"
        :title="videoMuted ? 'Activer la caméra' : 'Couper la caméra'"
        @click="toggleVideo"
      >
        <VideoOff v-if="videoMuted" class="h-5 w-5" />
        <Video v-else class="h-5 w-5" />
      </button>

      <button
        :class="[
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
          isScreenSharing
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-gray-700 text-white hover:bg-gray-600',
        ]"
        title="Partager l'écran"
        @click="toggleScreenShare"
      >
        <Monitor class="h-5 w-5" />
      </button>

      <button
        class="flex h-12 w-16 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
        title="Raccrocher"
        @click="endCall"
      >
        <PhoneOff class="h-5 w-5" />
      </button>
    </div>

    <!-- post call  modal -->
    <Teleport to="body">
      <div
        v-if="showPostCallSummary"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      >
        <div class="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
          <div class="mb-6 text-center">
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Consultation terminée
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Résumé de votre téléconsultation
            </p>
          </div>

          <div class="space-y-3">
            <div
              class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">Durée</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                postCallData.duration
              }}</span>
            </div>
            <div
              class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">Qualité de connexion</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                postCallData.quality
              }}</span>
            </div>
            <div
              class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">Heure de début</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                postCallData.startTime
              }}</span>
            </div>
            <div
              class="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">Heure de fin</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                postCallData.endTime
              }}</span>
            </div>
          </div>

          <div class="mt-6">
            <UiButton class-name="w-full" @click="closePostCallSummary">
              Fermer
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Send,
  X,
  User,
  Maximize2,
  Minimize2,
  Wifi,
  CheckCircle,
} from "lucide-vue-next";
import SimplePeer from "simple-peer";
import { useMessagingStore } from "~/stores/messaging";
import { useAuthenticatedFetch } from "~/composables/useAuthenticatedFetch";
import { useAuthStore } from "~/stores/auth";

interface TeleconsultationSession {
  id: string;
  roomId: string;
  roomName: string;
  status: string;
  duration: number | null;
  startedAt: string | null;
  endedAt: string | null;
  connectionQuality: string | null;
  patient?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  practitioner?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
}

const props = defineProps<{
  appointmentId: string;
  session: TeleconsultationSession;
}>();

const emit = defineEmits<{
  close: [];
}>();

const config = useRuntimeConfig();
const authStore = useAuthStore();
const messagingStore = useMessagingStore();
const { send, on, off } = messagingStore;

const remoteVideoRef = ref<HTMLVideoElement | null>(null);
const localVideoRef = ref<HTMLVideoElement | null>(null);
const chatContainerRef = ref<HTMLDivElement | null>(null);

const localStream = ref<MediaStream | null>(null);
const remoteStream = ref<MediaStream | null>(null);
const callStatus = ref<"waiting" | "connecting" | "connected">("waiting");
const audioMuted = ref(false);
const videoMuted = ref(false);
const isScreenSharing = ref(false);
const localVideoExpanded = ref(false);
const chatOpen = ref(false);
const chatInput = ref("");
const unreadMessages = ref(0);
const callStartTime = ref<Date | null>(null);
const callDuration = ref("00:00");
const connectionQuality = ref<"good" | "medium" | "poor">("good");

const chatMessages = ref<{ text: string; fromSelf: boolean; time: string }[]>(
  [],
);

const showPostCallSummary = ref(false);
const postCallData = ref({
  duration: "",
  quality: "",
  startTime: "",
  endTime: "",
});

let peer: SimplePeer.Instance | null = null;
let screenStream: MediaStream | null = null;
let durationInterval: ReturnType<typeof setInterval> | null = null;
let qualityInterval: ReturnType<typeof setInterval> | null = null;
let reannounceTimer: ReturnType<typeof setTimeout> | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

const connectionQualityColor = computed(() => {
  switch (connectionQuality.value) {
    case "good":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "poor":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
});

const connectionQualityLabel = computed(() => {
  switch (connectionQuality.value) {
    case "good":
      return "Bonne";
    case "medium":
      return "Moyenne";
    case "poor":
      return "Faible";
    default:
      return "";
  }
});

// other users id for signaling
const targetUserId = computed(() => {
  const currentUserId = authStore.user?.id;
  if (!currentUserId) return null;

  // if im  patient, target is practitioner
  if (props.session.patient?.userId === currentUserId) {
    return props.session.practitioner?.userId || null;
  }

  // if Im  practitioner, target is patient
  if (props.session.practitioner?.userId === currentUserId) {
    return props.session.patient?.userId || null;
  }

  return null;
});

// init media and ws
const initMedia = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    localStream.value = stream;
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = stream;
      localVideoRef.value.play?.().catch(() => {});
    }
  } catch (err) {
    console.error("Failed to access media devices:", err);
  }
};

const joinError = ref<string | null>(null);

const joinSession = async (): Promise<boolean> => {
  try {
    await useAuthenticatedFetch(`/teleconsultations/${props.session.id}/join`, {
      method: "POST",
    });
    joinError.value = null;
    return true;
  } catch (e: any) {
    const message =
      e?.data?.message || e?.message || "Impossible de rejoindre la session";
    console.error("Failed to join session:", e);
    joinError.value = message;
    return false;
  }
};

const retryJoin = async () => {
  joinError.value = null;
  const joined = await joinSession();
  if (!joined) return;

  // avoid duplicate listeners
  off("webrtc_offer", handleOffer);
  off("webrtc_answer", handleAnswer);
  off("webrtc_ice_candidate", handleIceCandidate);
  off("teleconsult_joined", handleRemoteJoined);
  off("teleconsult_left", handleRemoteLeft);
  off("teleconsult_chat", handleChatMessage);

  on("webrtc_offer", handleOffer);
  on("webrtc_answer", handleAnswer);
  on("webrtc_ice_candidate", handleIceCandidate);
  on("teleconsult_joined", handleRemoteJoined);
  on("teleconsult_left", handleRemoteLeft);
  on("teleconsult_chat", handleChatMessage);

  if (targetUserId.value) {
    send({
      type: "teleconsult_joined",
      targetUserId: targetUserId.value,
      sessionId: props.session.id,
    });
  }
};

const reannounceJoin = () => {
  // manual recovery for stuck waiting after tab/rejoin
  if (reannounceTimer) {
    clearTimeout(reannounceTimer);
    reannounceTimer = null;
  }
  stopDurationTimer();
  stopQualityMonitor();
  if (peer) {
    try { peer.destroy(); } catch {}
    peer = null;
    remoteStream.value = null;
  }
  callStatus.value = "waiting";
  if (targetUserId.value) {
    send({
      type: "teleconsult_joined",
      targetUserId: targetUserId.value,
      sessionId: props.session.id,
    });
    // also rejoin the session to refresh timestamps
    joinSession().catch(() => {});
  }
};

const destroyPeerAndReconnect = () => {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  stopDurationTimer();
  stopQualityMonitor();
  if (peer) {
    try {
      peer.destroy();
    } catch {}
    peer = null;
  }
  remoteStream.value = null;
  callStatus.value = "waiting";
  scheduleReannounce(1000);
};

const createPeer = (initiator: boolean) => {
  if (!localStream.value) {
    console.warn("Creating peer without local stream (media may be one-way)");
  }

  let iceServers: { urls: string; username?: string; credential?: string }[] = [];

  if (config.public.webrtcIceServers) {
    try {
      iceServers = JSON.parse(config.public.webrtcIceServers as string);
    } catch (e) {
      console.error("Failed to parse NUXT_PUBLIC_WEBRTC_ICE_SERVERS:", e);
    }
  }

  if (!iceServers.length) {
    // Default fallback: use STUN everywhere
    iceServers.push({ urls: "stun:stun.l.google.com:19302" });

    // Only append the production TURN server when we are NOT on a local hostname.
    // This prevents 50-second timeout/connection failure loops in local environments.
    const isLocal = typeof window !== "undefined" && (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname.startsWith("10.") ||
      window.location.hostname.endsWith(".local")
    );

    if (!isLocal) {
      iceServers.push(
        {
          urls: "turn:medicote.me:3478",
          username: "medicote",
          credential: "medicoteTurn2025",
        },
        {
          urls: "turn:medicote.me:3478?transport=tcp",
          username: "medicote",
          credential: "medicoteTurn2025",
        }
      );
    }
  }

  peer = new SimplePeer({
    initiator,
    stream: localStream.value || undefined,
    trickle: true,
    config: {
      iceServers,
    },
  });

  const pc = (peer as any)._pc as RTCPeerConnection | undefined;
  if (pc) {
    // Use only onconnectionstatechange to avoid duplicate events from
    // iceconnectionstatechange causing a reconnect storm on transient states.
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('WebRTC connection state update:', state);

      if (state === 'connected' || state === 'completed') {
        // Connection established — cancel any pending reconnect timer.
        if (disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
        }
      } else if (state === 'failed') {
        // Debounce 2 s to allow a browser-initiated ICE restart before we
        // tear down the peer entirely.
        if (!disconnectTimer) {
          disconnectTimer = setTimeout(() => {
            disconnectTimer = null;
            if (pc.connectionState === 'failed') {
              console.error('WebRTC connection failed, reconnecting');
              destroyPeerAndReconnect();
            }
          }, 2000);
        }
      }
      // 'disconnected' is intentionally NOT handled here — the browser's
      // built-in ICE restart recovers from transient drops in 1–3 s without
      // us tearing down the peer (which would freeze video for much longer).
    };
  }

  peer.on("signal", (data: SimplePeer.SignalData) => {
    if (!targetUserId.value) {
      console.error("Cannot send signal: targetUserId not available");
      return;
    }

    if (data.type === "offer") {
      send({
        type: "webrtc_offer",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
        signal: data,
      });
    } else if (data.type === "answer") {
      send({
        type: "webrtc_answer",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
        signal: data,
      });
    } else {
      // ice candidate — sent incrementally while trickle ICE is enabled
      send({
        type: "webrtc_ice_candidate",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
        candidate: data,
      });
    }
  });

  peer.on("stream", (stream: MediaStream) => {
    remoteStream.value = stream;
    if (remoteVideoRef.value) {
      remoteVideoRef.value.srcObject = stream;
      const vid = remoteVideoRef.value;
      const tryPlay = () => vid.play?.().catch(() => {});
      tryPlay();
      vid.addEventListener('stalled', tryPlay, { once: true });
      vid.addEventListener('waiting', tryPlay, { once: true });
      vid.addEventListener('canplay', tryPlay, { once: true });
      vid.addEventListener('error', (e) => console.warn('remote video error', e), { once: true });
    }
    callStatus.value = "connected";
    callStartTime.value = new Date();
    startDurationTimer();
    startQualityMonitor();
  });

  peer.on("connect", () => {
    if (callStatus.value === "waiting") callStatus.value = "connecting";
  });

  peer.on("close", () => {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }
    stopDurationTimer();
    stopQualityMonitor();
    callStatus.value = "waiting";
    remoteStream.value = null;
    peer = null;
    scheduleReannounce();
  });

  peer.on("error", (err: Error) => {
    console.error("Peer error:", err);
    const wasConnected = callStatus.value === "connected";
    if (wasConnected || callStatus.value === "connecting") {
      destroyPeerAndReconnect();
    } else {
      if (peer) {
        try { peer.destroy(); } catch {}
        peer = null;
      }
    }
  });
};

const scheduleReannounce = (delay = 2000) => {
  if (reannounceTimer) clearTimeout(reannounceTimer);
  reannounceTimer = setTimeout(() => {
    reannounceTimer = null;
    if (!peer && targetUserId.value && !showPostCallSummary.value) {
      send({
        type: "teleconsult_joined",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
      });
      joinSession().catch(() => {});
    }
  }, delay);
};

// webrtc signaling handlers
const handleOffer = (data: {
  signal: SimplePeer.SignalData;
  fromUserId: string;
  sessionId: string;
}) => {
  if (data.sessionId !== props.session.id) return;
  callStatus.value = "connecting";
  if (!peer) {
    createPeer(false);
  }
  peer?.signal(data.signal);
};

const handleAnswer = (data: {
  signal: SimplePeer.SignalData;
  fromUserId: string;
  sessionId: string;
}) => {
  if (data.sessionId !== props.session.id) return;
  if (!peer) {
    // late answer, create as non-initiator
    createPeer(false);
  }
  peer?.signal(data.signal);
};

const handleIceCandidate = (data: {
  candidate: SimplePeer.SignalData;
  fromUserId: string;
  sessionId: string;
}) => {
  if (data.sessionId !== props.session.id) return;
  if (peer) {
    peer.signal(data.candidate);
  }
};

const handleRemoteJoined = (data: { userId: string; sessionId: string }) => {
  if (data.sessionId !== props.session.id) return;

  const otherId = data.userId;
  const myId = authStore.user?.id || "";

  const isWaiting = callStatus.value === "waiting" || !peer;
  const shouldReset = isWaiting;

  // reset only when recovering from waiting/left (prevents destroying a working call on spurious joined)
  if (shouldReset && peer) {
    try {
      peer.destroy();
    } catch {}
    peer = null;
    remoteStream.value = null;
  }

  if (shouldReset) {
    callStatus.value = "connecting";

    const iAmInitiator = !otherId || myId < otherId;
    createPeer(iAmInitiator);
  }

  if (shouldReset && otherId) {
    send({
      type: "teleconsult_joined",
      targetUserId: otherId,
      sessionId: props.session.id,
    });
  }
};

const handleRemoteLeft = (data: { userId: string; sessionId: string }) => {
  if (data.sessionId !== props.session.id) return;
  stopDurationTimer();
  stopQualityMonitor();
  peer?.destroy();
  peer = null;
  remoteStream.value = null;
  callStatus.value = "waiting";
};

const handleChatMessage = (data: {
  message: string;
  fromUserId: string;
  timestamp: string;
}) => {
  chatMessages.value.push({
    text: data.message,
    fromSelf: data.fromUserId === authStore.user?.id,
    time: new Date(data.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  if (!chatOpen.value && data.fromUserId !== authStore.user?.id) {
    unreadMessages.value++;
  }
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const toggleAudio = () => {
  audioMuted.value = !audioMuted.value;
  localStream.value?.getAudioTracks().forEach((t) => {
    t.enabled = !audioMuted.value;
  });
};

const toggleVideo = () => {
  videoMuted.value = !videoMuted.value;
  localStream.value?.getVideoTracks().forEach((t) => {
    t.enabled = !videoMuted.value;
  });
};

const toggleChat = () => {
  chatOpen.value = !chatOpen.value;
  if (chatOpen.value) {
    unreadMessages.value = 0;
  }
};

const sendChatMessage = () => {
  const text = chatInput.value.trim();
  if (!text || !targetUserId.value) return;
  send({
    type: "teleconsult_chat",
    targetUserId: targetUserId.value,
    sessionId: props.session.id,
    message: text,
  });
  chatMessages.value.push({
    text,
    fromSelf: true,
    time: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  chatInput.value = "";
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const toggleScreenShare = async () => {
  if (isScreenSharing.value) {
    stopScreenShare();
  } else {
    await startScreenShare();
  }
};

const startScreenShare = async () => {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const videoTrack = screenStream.getVideoTracks()[0];
    if (peer && localStream.value && videoTrack) {
      const pc = (peer as unknown as { _pc: RTCPeerConnection })._pc;
      const sender = pc
        ?.getSenders?.()
        ?.find((s: RTCRtpSender) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }
    }
    isScreenSharing.value = true;
    if (targetUserId.value) {
      send({
        type: "screen_share_started",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
      });
    }

    if (videoTrack) {
      videoTrack.onended = () => {
        stopScreenShare();
      };
    }
  } catch {
    // user cancelled or error
  }
};

const stopScreenShare = () => {
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }
  // restore camera track
  if (peer && localStream.value) {
    const videoTrack = localStream.value.getVideoTracks()[0];
    if (videoTrack) {
      const pc = (peer as unknown as { _pc: RTCPeerConnection })._pc;
      const sender = pc
        ?.getSenders?.()
        ?.find((s: RTCRtpSender) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    }
  }
  isScreenSharing.value = false;
  if (targetUserId.value) {
    send({
      type: "screen_share_stopped",
      targetUserId: targetUserId.value,
      sessionId: props.session.id,
    });
  }
};

const endCall = async () => {
  const endTime = new Date();
  try {
    await useAuthenticatedFetch(`/teleconsultations/${props.session.id}/end`, {
      method: "POST",
    });
  } catch (e) {
    console.error("Error ending session:", e);
  }

  if (reannounceTimer) {
    clearTimeout(reannounceTimer);
    reannounceTimer = null;
  }
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  stopDurationTimer();
  stopQualityMonitor();
  peer?.destroy();
  peer = null;

  // clean up streams
  localStream.value?.getTracks().forEach((t) => t.stop());
  localStream.value = null;
  remoteStream.value = null;

  // show summary post call
  const start = callStartTime.value;
  postCallData.value = {
    duration: callDuration.value || "< 1 min",
    quality: connectionQualityLabel.value,
    startTime: start
      ? start.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    endTime: endTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  showPostCallSummary.value = true;
};

const closePostCallSummary = () => {
  showPostCallSummary.value = false;
  emit("close");
};

// duration timer
const startDurationTimer = () => {
  durationInterval = setInterval(() => {
    if (callStartTime.value) {
      const diff = Math.floor(
        (Date.now() - callStartTime.value.getTime()) / 1000,
      );
      const mins = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0");
      const secs = (diff % 60).toString().padStart(2, "0");
      callDuration.value = `${mins}:${secs}`;
    }
  }, 1000);
};

const stopDurationTimer = () => {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
};

// connection quality monitoring
const startQualityMonitor = () => {
  qualityInterval = setInterval(async () => {
    if (!peer) return;
    try {
      const pc = (peer as unknown as { _pc: RTCPeerConnection | undefined })
        ._pc;
      if (!pc) return;
      const stats = await pc.getStats();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stats.forEach((report: Record<string, any>) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const rtt = report.currentRoundTripTime;
          if (rtt !== undefined) {
            if (rtt < 0.1) connectionQuality.value = 'good';
            else if (rtt < 0.3) connectionQuality.value = 'medium';
            else connectionQuality.value = 'poor';
          }
        }
      });
      // Quality is measured locally only — reporting to the backend every 5 s
      // was triggering token refreshes which caused the WebSocket to reconnect
      // mid-call, dropping ICE candidates and freezing video.
    } catch {
      // ignore stats errors
    }
  }, 5000);
};

const stopQualityMonitor = () => {
  if (qualityInterval) {
    clearInterval(qualityInterval);
    qualityInterval = null;
  }
};

onMounted(async () => {
  await initMedia();

  messagingStore.connect();

  const joined = await joinSession();
  if (!joined) return;

  on("webrtc_offer", handleOffer);
  on("webrtc_answer", handleAnswer);
  on("webrtc_ice_candidate", handleIceCandidate);
  on("teleconsult_joined", handleRemoteJoined);
  on("teleconsult_left", handleRemoteLeft);
  on("teleconsult_chat", handleChatMessage);

  if (targetUserId.value) {
    send({
      type: "teleconsult_joined",
      targetUserId: targetUserId.value,
      sessionId: props.session.id,
    });
  }

  setTimeout(() => {
    if (targetUserId.value && !peer) {
      send({
        type: "teleconsult_joined",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
      });
    }
  }, 800);
  setTimeout(() => {
    if (targetUserId.value && !peer) {
      send({
        type: "teleconsult_joined",
        targetUserId: targetUserId.value,
        sessionId: props.session.id,
      });
    }
  }, 2500);
});

onUnmounted(() => {
  // clean up
  off("webrtc_offer", handleOffer);
  off("webrtc_answer", handleAnswer);
  off("webrtc_ice_candidate", handleIceCandidate);
  off("teleconsult_joined", handleRemoteJoined);
  off("teleconsult_left", handleRemoteLeft);
  off("teleconsult_chat", handleChatMessage);

  if (reannounceTimer) {
    clearTimeout(reannounceTimer);
    reannounceTimer = null;
  }
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  if (targetUserId.value) {
    send({
      type: "teleconsult_left",
      targetUserId: targetUserId.value,
      sessionId: props.session.id,
    });
  }

  stopDurationTimer();
  stopQualityMonitor();
  peer?.destroy();
  peer = null;
  localStream.value?.getTracks().forEach((t) => t.stop());
  screenStream?.getTracks().forEach((t) => t.stop());
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
