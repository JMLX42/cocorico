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

		login: {
			USERNAME: "Utilisateur",
			PASSWORD: "Mot de passe",
			FORGOTTEN_PASSWORD: "Mot de passe oublié",
			SIGN_IN: "Se Connecter",
			SIGN_OUT: "Se Déconnecter",
			SIGN_UP: "Créer un compte",
			SIGN_IN_URL: "/connexion"
		},

		footer: {
			PRIVACY_POLICY: "Politique de Confidentialité",
			PRIVACY_POLICY_URL: "/politique-de-confidentialite",
			SOURCE_CODE: "Code Source"
		},

		poll: {
			POLLS: 'Référendums',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VOTE: 'je vote { value }',
			ALREADY_VOTED: 'Vous avez voté \'{ value }\' le { date }.',
			LOGIN_REQUIRED: 'Vous devez être connecté pour voter.',
			ADDITIONAL_DATA: 'Données Additionnelles',
			PARTICIPATION: 'Participation'
		},

		error : {
			ERROR_404: 'Oops... nous n\'avons pas pu trouver la page que vous cherchez !'
		}
	}
}

module.exports = Intl;
