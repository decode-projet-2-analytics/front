# Admin Realtime Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher aux administrateurs connectés des toasts temps réel cliquables pour les nouveaux messages et demandes d'appel envoyés par les webmasters.

**Architecture:** Le namespace backend `/chat` conserve la validation et la persistance des actions, puis transmet un payload minimal au namespace global `/notifications`, limité à la room `role:Admin`. Le frontend écoute ces événements dans le provider protégé global, transforme les payloads en présentations testables et affiche des toasts Sonner qui naviguent vers la conversation.

**Tech Stack:** Node.js, Socket.IO 4.8, Next.js 16, React 19, TypeScript, next-intl, Sonner, Node test runner.

## Global Constraints

- Notifications réservées aux utilisateurs globaux ayant le rôle `Admin`.
- Aucun événement émis par un administrateur ne produit de notification administrateur.
- Aucun historique, compteur, notification système ou rejeu après reconnexion.
- Chaque toast ouvre `/help/chat/{conversationId}` et utilise `notificationId` pour la déduplication locale.
- Les payloads sont minimaux et les listeners Socket.IO sont retirés au démontage.

---

### Task 1: Publication backend isolée par rôle

**Files:**
- Create: `../back/lib/socket/notifications/publish.js`
- Create: `../back/lib/socket/notifications/publish.test.js`
- Modify: `../back/lib/socket/notifications/index.js`
- Modify: `../back/lib/socket/chat/index.js`
- Modify: `../back/package.json`

**Interfaces:**
- Consumes: une instance Socket.IO initialisée, `agent.role`, les messages sérialisés et les invitations d'appel déjà validées.
- Produces: `publishAdminMessageNotification(io, payload)` et `publishAdminCallNotification(io, payload)`, qui émettent respectivement `notification:message` et `notification:call` vers `role:Admin`.

- [ ] **Step 1: Écrire les tests en échec**

Créer des tests Node qui injectent un faux namespace et vérifient exactement le nom d'événement, la room et le payload. Ajouter aussi des tests sur `buildAdminMessageNotification(agent, message)` et `buildAdminCallNotification(agent, call)` : résultat `null` pour `Admin`, payload typé pour `Webmaster`, aperçu de message limité à 120 caractères.

- [ ] **Step 2: Vérifier l'échec attendu**

Run: `node --test lib/socket/notifications/publish.test.js`

Expected: FAIL avec `Cannot find module './publish'`.

- [ ] **Step 3: Implémenter le module minimal**

Exporter les constantes `ADMIN_MESSAGE_NOTIFICATION` et `ADMIN_CALL_NOTIFICATION`, les deux builders purs et les deux publishers. Les publishers ciblent `io.of('/notifications').to('role:Admin').emit(...)`. Les builders refusent tout rôle autre que `Webmaster`.

- [ ] **Step 4: Brancher le chat après validation**

Dans `MESSAGE_SEND`, publier après la sérialisation avec `notificationId: String(message.id)`. Dans `CALL_INVITE`, publier après `createCall` avec `notificationId: callId`. Ne modifier ni les rooms `/chat` ni le flux WebRTC.

- [ ] **Step 5: Vérifier les tests backend**

Run: `npm test`

Expected: tous les tests passent, sans avertissement ni échec.

- [ ] **Step 6: Commit backend signé**

```bash
git add lib/socket/notifications package.json lib/socket/chat/index.js
git commit -m "feat: publish admin support notifications"
```

---

### Task 2: Présentation frontend testable

**Files:**
- Create: `src/lib/adminNotificationPresentation.mjs`
- Create: `src/lib/adminNotificationPresentation.d.ts`
- Create: `tests/admin-notification-presentation.test.mjs`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: les payloads Socket.IO `AdminMessageNotification` et `AdminCallNotification`, une fonction de traduction et la locale courante.
- Produces: `getMessageNotificationPresentation(payload, translate)` et `getCallNotificationPresentation(payload, translate)`, chacune retournant `{ id, title, description, href }`.

- [ ] **Step 1: Écrire les tests en échec**

Tester le nom d'expéditeur avec fallback, l'aperçu, le lien localisé et les trois libellés média (`audio`, `video`, `audioVideo`).

- [ ] **Step 2: Vérifier l'échec attendu**

Run: `node --test tests/admin-notification-presentation.test.mjs`

Expected: FAIL avec `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implémenter le mapping minimal**

Les fonctions retournent l'identifiant reçu sans le régénérer, construisent `/${locale}/help/chat/${conversationId}` via un paramètre `locale`, et choisissent le libellé média depuis les booléens validés.

- [ ] **Step 4: Ajouter les traductions FR/EN**

Ajouter sous `Support.notifications` les clés `newMessage`, `incomingCall`, `unknownSender`, `messageDescription`, `callDescription`, `audio`, `video` et `audioVideo`.

- [ ] **Step 5: Vérifier les tests frontend ciblés**

Run: `npm test -- tests/admin-notification-presentation.test.mjs`

Expected: tous les tests ciblés passent.

---

### Task 3: Toasts globaux et navigation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/context/NotificationsProvider.tsx`
- Modify: `src/app/[locale]/(backoffice)/(protected)/layout.tsx`

**Interfaces:**
- Consumes: les événements `notification:message` et `notification:call`, les fonctions de présentation de Task 2 et `router.push`.
- Produces: un `Toaster` global et un toast Sonner dédupliqué avec `id`, cliquable au clavier et à la souris.

- [ ] **Step 1: Installer Sonner**

Run: `npm install sonner`

Expected: `sonner` apparaît dans `dependencies` et le lockfile est actualisé.

- [ ] **Step 2: Étendre le provider**

Ajouter les types de payload, enregistrer les listeners uniquement lorsque `userRole === 'Admin'`, appeler `toast(title, { id, description, action: { label, onClick } })`, et retirer exactement les mêmes callbacks dans le cleanup.

- [ ] **Step 3: Monter le Toaster global**

Rendre `<Toaster position="top-right" richColors closeButton />` dans le layout protégé, à côté des enfants du provider.

- [ ] **Step 4: Vérifier tout le frontend**

Run: `npm test`

Expected: tous les tests frontend passent.

Run: `npm run lint`

Expected: exit code 0, aucune erreur ESLint.

Run: `npm run build`

Expected: exit code 0, compilation TypeScript et build Next.js réussis.

- [ ] **Step 5: Auto-relecture des critères d'acceptation**

Vérifier dans le diff : room `role:Admin`, filtre `Webmaster`, redirection vers la bonne conversation, déduplication par `notificationId`, traductions FR/EN, nettoyage des listeners et absence de persistance.

- [ ] **Step 6: Commit frontend signé**

```bash
git add package.json package-lock.json src/context/NotificationsProvider.tsx src/app/[locale]/\(backoffice\)/\(protected\)/layout.tsx src/lib/adminNotificationPresentation.mjs src/lib/adminNotificationPresentation.d.ts tests/admin-notification-presentation.test.mjs messages/fr.json messages/en.json docs/superpowers/plans/2026-07-15-admin-realtime-notifications.md
git commit -m "feat: notify admins of support activity"
```
