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
			TITLE: "Cocorico"
		},

		route: {
			SIGN_IN: "/connexion",
			PRIVACY_POLICY: "/politique-de-confidentialite",
			POLL: "/vote",
			MY_BILLS: "/mes-textes",
			CREATE_BILL: "/texte/nouveau",
			VIEW_BILL: "/texte",
			VIEW_BILL_TAB_ARGUMENTS: "arguments",
			VIEW_BILL_TAB_SOURCES: "sources",
			VIEW_BILL_TAB_PROPOSITIONS: "propositions",
			EDIT_BILL: "/texte/modifier",
			DELETE_BILL: "/texte/supprimer",
			SERVICE_STATUS: "/systeme/etat"
		},

		login: {
			USERNAME: "Utilisateur",
			PASSWORD: "Mot de passe",
			FORGOTTEN_PASSWORD: "Mot de passe oublié",
			SIGN_IN: "Se Connecter",
			SIGN_IN_WITH: "Se connecter avec",
			SIGN_OUT: "Se Déconnecter",
			SIGN_UP: "Créer un compte",
			REQUIRE_LOGIN: "Vous devez être connecté pour accéder à cette page."
		},

		footer: {
			PRIVACY_POLICY: "Politique de Confidentialité",
			SOURCE_CODE: "Code Source",
			SERVICE_STATUS: "Etat du Système"
		},

		page: {
			myBills : {
				TITLE: "Mes Textes",
				NO_BILL: "Aucun texte.",
				NEW_BILL: 'Créer un texte'
			},

			createBill: {
				TITLE: "Créer un nouveau texte"
			},

			editBill: {
				TITLE: "Modifier un texte"
			}
		},

		sort: {
			SORTED_BY_POPULARITY: "tri{gender, select, male {é} female {ée}}s par popularité"
		},

		bill: {
			BILLS: 'Textes',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VOTE: 'je vote { value }',
			VOTE_PENDING: 'Enregistrement de votre vote en cours...',
			VOTER_GENDER_MALE: 'homme',
			VOTER_GENDER_FEMALE: 'femme',
			UNVOTE: 'retirer mon vote',
			ALREADY_VOTED: 'Vous avez voté \'{ value }\' le { date }.',
			TOO_LATE_TO_VOTE: 'Vous ne pouvez plus voter pour ce texte.',
			TOO_LATE_TO_REVIEW: 'Vous ne pouvez plus faire de propositions pour ce texte.',
			TOO_LATE_TO_DEBATE: 'Vous ne pouvez plus débattre de ce texte.',
			LOGIN_REQUIRED: 'Vous devez être connecté pour voter.',
			ADDITIONAL_DATA: 'Données Additionnelles',
			YOUR_VOTE: 'Votre Vote',
			NO_PROPOSAL: 'Aucune proposition.',
			ADD_PROPOSAL: 'Faire une proposition',
			ADD_PROPOSAL_LOGIN: 'Vous devez être connecté pour faire une proposition.',
			NO_ARGUMENT: 'Aucun argument.',
			ADD_ARGUMENT: 'Ajouter un argument \'{ value }\'',
			ADD_ARGUMENT_LOGIN: 'Vous devez être connecté pour noter ou proposer un argument.',
			BILL_SOURCES: 'Sources mentionnées dans le texte',
			COMMUNITY_SOURCES: 'Sources ajoutées par la communauté',
			NO_SOURCE: 'Aucune source.',
			ADD_SOURCE_BUTTON: 'Ajouter une source',
			ADD_SOURCE_FORM_TITLE: 'Ajouter une source',
			ADD_SOURCE_LOGIN: 'Vous devez être connecté pour noter ou proposer une source.',
			ADD_SOURCE_URL_HINT: 'Adresse Web de la source que vous désirez ajouter :',
			ADD_SOURCE_SUBMIT_BUTTON: 'Ajouter',
			LIKE_BUTTON_TITLE: "J'approuve",
			DISLIKE_BUTTON_TITLE: "Je désapprouve"
		},

		billEditor: {
			BUTTON_SAVE: 'Enregistrer',
			BUTTON_VIEW: 'Voir le texte',
			TITLE: 'Titre',
			TITLE_PLACEHOLDER: 'le titre de votre texte',
			CONTENT: 'Texte',
			CONTENT_PLACEHOLDER: 'le contenu de votre texte'
		},

		error : {
			ERROR_404: 'Oops... nous n\'avons pas pu trouver la page que vous cherchez !',
			ERROR_SOURCE_ALREADY_EXISTS: 'Cette source a déjà été ajoutée.',
			ERROR_SOURCE_NOT_FOUND: 'Cette source n\'existe pas.'
		}
	}
}

module.exports = Intl;
