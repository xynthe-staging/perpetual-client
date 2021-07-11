import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  	html {
        --color-background: #000240;
        --color-background-secondary: #00125D;
        --color-text: #fff;
        --color-primary: #3da8f5;
        --color-secondary: #005ea4;
        --color-accent: #002886;

        --status-lightblue: #3da8f5;
        --status-orange: #F15025;
        --status-white: #fff;

        --table-darkborder: #00156C;
        --table-semidarkborder: #000240;
        --table-lightborder: #002886;
        
        --font-size-extra-small: 13px;
        --font-size-small: 16px;
        --font-size-medium: 20px;
        --font-size-large: 20px;
        --font-size-xlarge: 36px;

        --height-extra-small-container: 48px;
        --height-small-container: 60px;
        --height-medium-button: 32px;
        --height-small-button: 28px;
        --height-extra-small-button: 22px;

        @media (max-width: 1600px) { 
            --font-size-extra-small: 12px;
            --font-size-small: 13px;
            --font-size-medium: 16px;
            --font-size-large: 20px;
            --font-size-xlarge: 40px;
            --height-small-container: 44px;
            --height-extra-small-container: 40px;
        }
      
        background-color: var(--color-background);
        color: var(--color-text);
  	}

    .tracer-loading {
        font-size: 32px;
        color: var(--color-secondary);
    }


	/* ANTD overrides */
	.ant-tooltip-inner {
		background: var(--color-accent);
		color: var(--color-text);
	}
	.ant-tooltip-inner strong {
		color: var(--color-primary);
	}
    .ant-tooltip-inner a {
        text-decoration: underline;
      
        &:hover {
            color: var(--color-primary);
        }
    }
	.ant-tooltip-arrow-content {
		background-color: var(--color-accent);
	}

    /** GLOBAL TABLE STYLES */
    .bid, .green {
        color: #05CB3A;
    }

    .ask, .red {
        color: #F15025;
    }

    /* Scroll bar stuff */
    ::-webkit-scrollbar {
        width: 5px;
        height: 8px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: transparent;
    }

    /* Corner piece */
    ::-webkit-scrollbar-corner {
        display: none;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: var(--color-primary);
        cursor: pointer;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: var(--color-accent);
    }

    /* Space the buttons and titles on Portfolio pages on opposite ends to each other */
    .justify-content-between {
        width: 100%;
        justify-content: space-between;
    }
`;
