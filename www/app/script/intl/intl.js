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
			MY_TEXTS: "/mes-textes",
			CREATE_TEXT: "/texte/nouveau",
			VIEW_TEXT: "/texte",
			VIEW_TEXT_TAB_ARGUMENTS: "arguments",
			VIEW_TEXT_TAB_SOURCES: "sources",
			VIEW_TEXT_TAB_PROPOSITIONS: "propositions",
			EDIT_TEXT: "/texte/modifier",
			DELETE_TEXT: "/texte/supprimer"
		},

		login: {
			USERNAME: "Utilisateur",
			PASSWORD: "Mot de passe",
			FORGOTTEN_PASSWORD: "Mot de passe oublié",
			SIGN_IN: "Se Connecter",
			SIGN_OUT: "Se Déconnecter",
			SIGN_UP: "Créer un compte",
			REQUIRE_LOGIN: "Vous devez être connecté pour accéder à cette page."
		},

		footer: {
			PRIVACY_POLICY: "Politique de Confidentialité",
			SOURCE_CODE: "Code Source"
		},

		page: {
			myTexts : {
				TITLE: "Mes Textes",
				NO_TEXT: "Aucun texte.",
				NEW_TEXT: 'Créer un texte'
			},

			createText: {
				TITLE: "Créer un nouveau texte"
			}
		},

		sort: {
			SORTED_BY_POPULARITY: "tri{gender, select, male {é} female {ée}}s par popularité"
		},

		text: {
			TEXTS: 'Textes',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VOTE: 'je vote { value }',
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
			TEXT_SOURCES: 'Sources mentionnées dans le texte',
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

		textEditor: {
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
