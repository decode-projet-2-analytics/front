# Frontend — Decode Analytics

Backoffice Next.js pour la plateforme Decode Analytics.

## Getting Started

Lancer le serveur de developpement :

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

L'API backend attendue par defaut est `http://localhost:3008/api/v1`. Elle peut etre surchargee via `NEXT_PUBLIC_API_URL`.

## User Story 3 — Credentials et equipe

### Credentials applicatifs

Dans le detail d'une application :

- onglet `General` : nom de l'application et URLs autorisees CORS ;
- actions credentials : generation et revocation du `APP_SECRET` ;
- `APP_ID` affiche dans l'en-tete/detail et repris dans les exemples d'integration.

Les actions credentials ne sont affichees qu'aux roles applicatifs `owner` et `admin`.

### Gestion d'equipe

La gestion d'equipe est rattachee au detail d'une application, dans l'onglet `Equipe`, place apres `Tunnels` et `Integration`.

L'onglet affiche :

- le proprietaire de l'application ;
- les membres actifs ;
- leur role applicatif (`owner`, `admin`, `member`, `viewer`) ;
- les invitations en attente pour `owner/admin`.

Permissions UI :

| Role applicatif | Voir l'equipe | Inviter | Modifier roles | Retirer membre |
|-----------------|---------------|---------|----------------|----------------|
| `owner` | oui | oui | oui | oui |
| `admin` | oui | oui | oui | oui |
| `member` | oui | non | non | non |
| `viewer` | oui | non | non | non |

Le lien d'invitation permet a un utilisateur non connecte de se connecter ou de s'inscrire. En inscription invitee, le token est conserve dans l'URL puis envoye a l'API pour rattacher automatiquement le compte a l'application.

### Dashboard et applications pour les membres

- Le dashboard affiche le role applicatif de l'application courante, et non le role global `Webmaster`.
- `member` et `viewer` peuvent consulter les widgets.
- Seuls `owner/admin` voient le bouton d'ajout de widget, les menus de configuration, suppression, edition et le drag reorder.
- Un compte qui est uniquement membre invite ne voit pas le formulaire de creation d'application.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
