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
			EDIT_TEXT: "/texte/modifier"
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
				NO_TEXT: "Vous n'avez aucun texte.",
				NEW_TEXT: 'Créer un texte'
			},

			createText: {
				TITLE: "Créer un nouveau texte"
			}
		},

		text: {
			TEXTS: 'Textes',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VOTE: 'je vote { value }',
			UNVOTE: 'retirer mon vote',
			ALREADY_VOTED: 'Vous avez voté \'{ value }\' le { date }.',
			LOGIN_REQUIRED: 'Vous devez être connecté pour voter.',
			ADDITIONAL_DATA: 'Données Additionnelles',
			PARTICIPATION: 'Participation'
		},

		textEditor: {
			SAVE: 'Enregistrer',
			TITLE: 'Titre',
			CONTENT: 'Texte'
		},

		error : {
			ERROR_404: 'Oops... nous n\'avons pas pu trouver la page que vous cherchez !'
		}
	}
}

module.exports = Intl;
