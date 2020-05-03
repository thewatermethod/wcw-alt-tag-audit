<?php

/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://www.mattbev.com
 * @since      1.0.0
 *
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Wcw_Alt_Tag_Audit
 * @subpackage Wcw_Alt_Tag_Audit/includes
 * @author     Matthew Bevilacqua <matt@whalingcityweb.com>
 */
class Wcw_Alt_Tag_Audit_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'wcw-alt-tag-audit',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
