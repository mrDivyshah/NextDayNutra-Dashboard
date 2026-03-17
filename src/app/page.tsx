import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import V2DashboardPage from "./v2/page";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/");
  }

  return <V2DashboardPage />;
}


// https://dashboard.divy.dpdns.org

/* 

add_filter( 'the_content', function ( $content ) {
	if ( ! is_page() ) return $content;
	global $post;
	if ( ! $post ) return $content;

	$login_url = add_query_arg( 'redirect_to', urlencode( get_permalink() ), 'https://dashboard.nextdaynutra.com/my-account/login' );

	switch ( $post->post_name ) {
		case 'admin-panel':
    if ( ! is_user_logged_in() || ! ( ch_is_am() || ch_is_admin() ) ) 
        return '<p>Access denied. case</p>';
    return ch_render_am_dashboard();
		case 'client-dashboard':
			if ( ! is_user_logged_in() ) { wp_safe_redirect( wp_login_url( get_permalink() ) ); exit(); }
			$client_id = ch_current_client_id_for_viewer();
			if ( ! $client_id ) return '<p>No customer selected.</p>';
			return ch_render_client_dashboard( $client_id );

		case 'executive':
			if ( ! is_user_logged_in() ) { wp_redirect( $login_url ); exit(); }
			$u = wp_get_current_user();
			if ( ! ( ch_is_admin( $u ) || ch_is_am( $u ) || ch_is_executive( $u ) ) ) return '<p>Access denied.</p>';
			return ch_render_executive_dashboard();

		case 'agent-dashboard':
			if ( ! is_user_logged_in() ) { wp_redirect( $login_url ); exit(); }
			$u = wp_get_current_user();
			if ( ! ( ch_is_admin( $u ) || ch_is_am( $u ) || ch_is_executive( $u ) || ch_is_agent( $u ) ) ) return '<p>Access denied.</p>';
			return ch_render_agent_dashboard();
	}

	return $content;
}, 20 );





*/