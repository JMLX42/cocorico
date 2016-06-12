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
			SIGN_IN_WITH: "Se connecter avec :",
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
			SORTED_BY_POPULARITY: "tri{gender, select, male {é} female {ée}}s par popularité",
			SORTED_BY_TIME: "tri{gender, select, male {é} female {ée}}s par date",
			SORTED_RANDOMLY: "tri{gender, select, male {é} female {ée}}s au hasard"
		},

		bill: {
			BILLS: 'Textes',
			TOO_LATE_TO_REVIEW: 'Ce texte n\'est plus en cours de révision : vous ne pouvez plus faire de propositions pour ce texte.',
			TOO_LATE_TO_DEBATE: 'Ce texte n\'est plus en cours de débat : vous ne pouvez plus proposer d\'arguments.',
			CONTRIBUTIONS: 'Contributions',
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
			ADD_SOURCE_CANCEL_BUTTON: 'Annuler',
			ADD_SOURCE_FORM_TITLE: 'Ajouter une source',
			ADD_SOURCE_LOGIN: 'Vous devez être connecté pour noter ou proposer une source.',
			ADD_SOURCE_URL_HINT: 'Adresse Web de la source que vous désirez ajouter :',
			ADD_SOURCE_SUBMIT_BUTTON: 'Ajouter',
			LIKE_BUTTON_TITLE: "J'approuve",
			DISLIKE_BUTTON_TITLE: "Je désapprouve",
			STATUS_DRAFT: 'Brouillon',
			STATUS_REVIEW: 'Révision',
			STATUS_DEBATE: 'Débat',
			STATUS_VOTE: 'Vote',
			STATUS_PUBLISHED: 'Publié',
			YOUR_VOTE: 'Votre Vote'
		},

		vote: {
			LOGIN_REQUIRED: 'Vous devez être connecté pour voter.',
			VOTE_YES: 'pour',
			VOTE_BLANK: 'blanc',
			VOTE_NO: 'contre',
			VOTE: 'je vote { value }',
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
			CONFIRM_VOTE_MESSAGE: 'Vous êtes sur le point de voter { value } au sujet du texte { bill }. Confirmez-vous votre choix ?',
			I_CONFIRM_MY_VOTE: 'je confirme : ',
			CANCEL_MY_VOTE: 'Annuler mon vote',
			IGNORE: 'Ignorer',
			NOT_RECOMMENDED: 'non recommandé',
			YOUR_VOTE_IS_BEING_RECORDED: 'Votre vote { value } au sujet du texte { bill } est en cours d\'enregistrement...',
			YOUR_VOTE_IS_COMPLETE: 'Votre vote { value } au sujet du texte { bill } a bien été envoyé !',
			STEP_1_TITLE: 'Votre carte d\'identité',
			STEP_2_TITLE: 'Votre carte de vote',
			STEP_3_TITLE: 'Confirmation de votre vote',
			STEP_4_TITLE: 'A voté !',
			STEP_1_NAME: 'Carte d\'identité',
			STEP_2_NAME: 'Carte de vote',
			STEP_3_NAME: 'Confirmation',
			STEP_4_NAME: 'A voté !',
			STEP_TITLE: 'Étape { step }/{ total } : { title }',
			REMOVING_VOTE: 'Suppression de votre vote en cours...'
		},

		proofOfVoteReader : {
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
