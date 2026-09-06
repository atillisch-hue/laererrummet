export type AuthenticatorAssuranceLevel="aal1"|"aal2";

/**
 * Read the AAL claim only AFTER the caller has validated this exact token with
 * Supabase Auth (for example admin.auth.getUser(token)). This helper does not
 * verify JWT signatures itself and must never be used on an unverified token.
 */
export function aalFromVerifiedAccessToken(token:string):AuthenticatorAssuranceLevel|null{
 try{
  const parts=token.split(".");
  if(parts.length!==3)return null;
  const payload=JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8")) as {aal?:unknown};
  return payload.aal==="aal2"?"aal2":payload.aal==="aal1"?"aal1":null;
 }catch{return null}
}

export function verifiedTokenHasAal2(token:string){return aalFromVerifiedAccessToken(token)==="aal2"}
