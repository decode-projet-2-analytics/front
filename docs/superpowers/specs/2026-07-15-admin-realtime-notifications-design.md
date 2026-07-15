# Notifications temps réel pour les administrateurs

## Objectif

Informer immédiatement les administrateurs connectés lorsqu'un webmaster envoie un message de support ou demande un appel. La notification doit être disponible depuis toute page protégée et ouvrir la conversation concernée au clic.

## Périmètre

- Notifications réservées aux utilisateurs globaux ayant le rôle `Admin`.
- Deux catégories : nouveau message et demande d'appel.
- Redirection vers `/help/chat/{conversationId}` au clic.
- Aucun historique persistant, compteur de notifications, notification système du navigateur ou notification hors ligne.
- Aucun toast pour un événement émis par un administrateur.

## Architecture

Le namespace Socket.IO `/notifications`, déjà connecté globalement par `NotificationsProvider`, transporte les notifications. Le namespace `/chat` conserve sa responsabilité actuelle : messages, présence dans une conversation et signalisation WebRTC.

Lorsque `/chat` accepte et persiste un message envoyé par un webmaster, le backend publie un événement typé vers la room `role:Admin` du namespace `/notifications`. Lorsqu'il accepte une invitation d'appel d'un webmaster, il publie de la même manière une notification d'appel.

Cette séparation permet aux administrateurs de recevoir les alertes sans rejoindre toutes les rooms de conversation et conserve l'isolation des flux par rôle.

## Contrats d'événements

### `notification:message`

```ts
{
  notificationId: string; // dérivé de l'identifiant du message
  conversationId: string;
  senderId: number;
  senderFirstname: string | null;
  preview: string;
}
```

`preview` est une version courte du contenu déjà validé et normalisé. Le frontend reste responsable de son échappement via le rendu React.

### `notification:call`

```ts
{
  notificationId: string; // dérivé de callId
  conversationId: string;
  callId: string;
  callerId: number;
  callerFirstname: string | null;
  media: { audio: boolean; video: boolean };
}
```

Les événements ne sont émis qu'après les contrôles existants d'accès à la conversation, de statut et de validité du contenu ou du média.

## Frontend

Le projet utilisera `sonner`, compatible avec les composants client React et suffisamment léger pour ce besoin.

Un `Toaster` global sera monté dans la zone protégée. `NotificationsProvider` écoutera les deux nouveaux événements uniquement pour le rôle `Admin` et déclenchera :

- un toast « Nouveau message » avec le prénom disponible et un aperçu ;
- un toast « Appel entrant » indiquant audio, vidéo ou audio et vidéo ;
- une navigation localisée vers la conversation au clic.

Sonner recevra `notificationId` comme identifiant de toast afin de dédupliquer un événement reçu plusieurs fois sur une même connexion. Les listeners seront retirés au démontage et lors d'un changement de socket.

## Comportements particuliers

- Un administrateur qui écrit ou lance un appel ne notifie pas les autres administrateurs.
- Plusieurs administrateurs connectés reçoivent chacun la notification.
- Plusieurs onglets d'un même administrateur peuvent chacun afficher le toast ; la déduplication est locale à chaque onglet.
- Une reconnexion n'entraîne pas de rejeu, puisqu'il n'existe pas d'historique dans ce périmètre.
- Une notification d'appel annulée reste un toast informatif ; l'état réel de l'appel est vérifié en ouvrant la conversation.
- Si la navigation échoue ou si la conversation n'est plus accessible, la page existante gère l'erreur d'accès.

## Tests

### Backend

- Un message de webmaster produit une notification admin avec un payload minimal et typé.
- Un message d'administrateur n'en produit pas.
- Une invitation d'appel de webmaster produit une notification admin.
- Une invitation invalide ou émise par un administrateur n'en produit pas.

### Frontend

- Le mapping d'un événement message produit le contenu et le lien attendus.
- Le mapping d'un événement appel distingue audio, vidéo et audio/vidéo.
- Les événements ne sont traités que pour un administrateur.
- L'identifiant de notification est transmis à Sonner pour la déduplication.

## Critères d'acceptation

1. Un administrateur connecté reçoit un toast sans être sur la page support lorsqu'un webmaster envoie un message.
2. Un administrateur connecté reçoit un toast lorsqu'un webmaster demande un appel.
3. Cliquer sur l'un des toasts ouvre la bonne conversation.
4. Aucun webmaster ne reçoit ces notifications administrateur.
5. Aucun événement émis par un administrateur ne génère un toast administrateur.
6. Les listeners Socket.IO sont nettoyés correctement et les tests automatisés passent.
