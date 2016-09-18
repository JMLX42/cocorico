var Intl = {
	locales: ["fr-FR"],

	formats: {
        date: {
            short: {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        },
        time: {
            hhmm: {
                hour: "numeric",
                minute: "numeric"
            }
        }
	},

	messages: {
		site: {
			TITLE: "Cocorico",
			LOADING: "Chargement"
		},

		route: {
			SIGN_IN: "/connexion",
			PRIVACY_POLICY: "/politique-de-confidentialite",
			POLL: "/vote",
			CREATE_BILL: "/texte/nouveau",
			SERVICE_STATUS: "/systeme/etat",
			BALLOT_BOX: "/vote/urne"
		},

		login: {
			USERNAME: "Utilisateur",
			PASSWORD: "Mot de passe",
			FORGOTTEN_PASSWORD: "Mot de passe oublié",
			SIGN_IN: "S'identifier",
			SIGN_IN_WITH: "S'identifier avec :",
			SIGN_OUT: "Se Déconnecter",
			SIGN_UP: "Créer un compte",
			REQUIRE_LOGIN: "Vous devez être connecté pour accéder à cette page."
		},

		footer: {
			PRIVACY_POLICY: "Politique de Confidentialité",
			SOURCE_CODE: "Code Source",
			SERVICE_STATUS: "Etat du Système",
			POWERED_BY: "Propulsé par {productName}"
		},

		sort: {
			SORTED_BY_POPULARITY: "tri{gender, select, male {é} female {ée}}s par popularité",
			SORTED_BY_TIME: "tri{gender, select, male {é} female {ée}}s par date",
			SORTED_RANDOMLY: "tri{gender, select, male {é} female {ée}}s au hasard"
		},

		vote: {
			VOTE: 'Voter',
			LOGIN_REQUIRED: 'Vous devez être connecté pour voter.',
			SOURCES: 'Sources',
			NO_SOURCE: 'Aucune sources.',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VALIDATE_BALLOT: 'Valider mon bulletin',
			I_VOTE: 'je vote "{ value }"',
			VOTE_PENDING: 'Vote en cours...',
			VOTER_GENDER_MALE: 'homme',
			VOTER_GENDER_FEMALE: 'femme',
			VOTE_DISABLED: 'Vote désactivé.',
			VOTE_UNAVAILABLE: 'Impossible de voter pour l\'instant. Merci de bien vouloir réessayer plus tard.',
			REMOVE_MY_VOTE: 'retirer mon vote',
			CHANGE_MY_VOTE: 'changer mon vote',
			ALREADY_VOTED: 'Vous avez voté le { date }.',
			TOO_LATE_TO_VOTE: 'Vous ne pouvez plus voter pour ce texte.',
			ANNOUNCE_VOTER_ID: 'Vous êtes sur le point de voter en tant que { name } né le { birthdate }',
			CONFIRM_VOTER_ID: 'Oui, je suis bien {name}',
			DENY_VOTER_ID: 'Non, ça n\'est pas moi',
			CREATE_NEW_VOTE_CARD: 'Créer une nouvelle carte de vote pour ce vote (recommandé)',
			USE_EXISTING_VOTE_CARD: 'Utiliser une carte de vote existante',
			CREATING_NEW_VOTE_CARD: 'Création d\'une nouvelle carte de vote en cours...',
			PRINT_VOTER_CARD: 'Imprimer ma carte de vote',
			DOWNLOAD_VOTER_CARD: 'Télécharger ma carte de vote',
			BEFORE_UNLOAD_MESSAGE: 'Si vous quittez ou actualiez cette page, vous ne pourrez jamais récupérer votre carte de vote.',
			EXIT: 'Terminer',
			EXIT_WITHOUT_VOTER_CARD: 'Terminer sans récupérer ma carte de vote',
			CONFIRM_VOTE_MESSAGE: 'Vous êtes sur le point de voter "{ value }" au sujet de { vote }. Confirmez-vous votre choix ?',
			I_CONFIRM_MY_VOTE: 'je confirme : ',
			CANCEL_MY_VOTE: 'Annuler mon vote',
			IGNORE: 'Ignorer',
			NOT_RECOMMENDED: 'non recommandé',
			YOUR_VOTE_IS_BEING_RECORDED: 'Votre vote "{ value }" au sujet de { vote } est en cours d\'enregistrement...',
			YOUR_VOTE_IS_COMPLETE: 'Votre vote "{ value }" au sujet de { vote } a bien été envoyé !',
			STEP_0_NAME: 'Bulletin de Vote',
			STEP_1_NAME: 'Carte d\'Identité',
			STEP_2_NAME: 'Carte de Vote',
			STEP_3_NAME: 'Confirmation',
			STEP_4_NAME: 'A voté !',
			STEP_TITLE: 'Étape { step }/{ total } : { title }',
			REMOVING_VOTE: 'Suppression de votre vote en cours...'
		},

		voterCard : {
			PROVIDE_VOTER_CARD: 'Pour continuer, merci de fournir votre carte de vote',
			SCAN_PRINTED_FILE: 'Utiliser ma webcam pour scanner ma carte de vote imprimée',
			SEND_DOWNLOADED_FILE: 'Envoyer le fichier de ma carte de vote téléchargée',
			BACK: 'Retour',
			CANCEL: 'Annuler'
		},

		hint: {
			HIDE_HINT_BUTTON: 'J\'ai compris, ne plus afficher ce message.',
			LEARN_MORE_BUTTON: 'En savoir plus...'
		},

		error : {
			ERROR_404: 'Oops... nous n\'avons pas pu trouver la page que vous cherchez !',
			ERROR_SOURCE_ALREADY_EXISTS: 'Cette source a déjà été ajoutée.',
			ERROR_SOURCE_NOT_FOUND: 'Cette source n\'existe pas.'
		}
	}
}

module.exports = Intl;
