import React from 'react';
import styled from 'styled-components';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const PrivacyContainer = styled.div`
  height: 100vh;
  max-width: 100vw;
  background: ${({ theme }) => theme.colors.appBg};
  color: #F8FAFC;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
`;

const PrivacyContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 90px 20px 40px;
  line-height: 1.7;
  height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
`;

const PrivacyTitle = styled.h1`
  font-size: 2.6rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1DB954 0%, #19a64c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const LastUpdated = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 1.2rem;
  font-size: 1rem;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: #F8FAFC;
  border-bottom: 2px solid rgba(29,185,84,0.55);
  padding-bottom: 0.35rem;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const SubSectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #F8FAFC;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const SubSubSectionTitle = styled.h4`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
  color: #F8FAFC;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Paragraph = styled.p`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1rem;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const UnorderedList = styled.ul`
  margin-bottom: 1rem;
  padding-left: 1.5rem;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
  color: #E2E8F0;
`;

const Strong = styled.strong`
  color: #F8FAFC;
  font-weight: 600;
`;

const Link = styled.a`
  color: #1DB954;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ContactList = styled.ul`
  list-style: none;
  padding-left: 0;
`;

const ContactItem = styled.li`
  margin-bottom: 0.5rem;
  color: #E2E8F0;
`;

function Privacy() {
  return (
    <PrivacyContainer>
      <Header 
        logo="Unitalks"
        hasSidebar={false}
      />
      
      <PrivacyContent>
        <PrivacyTitle>Privacy Policy</PrivacyTitle>
        <LastUpdated>Last updated: August 05, 2025</LastUpdated>
        
        <Paragraph>
          This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
        </Paragraph>
        
        <Paragraph>
          We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the <Link href="https://www.freeprivacypolicy.com/free-privacy-policy-generator/" target="_blank">Free Privacy Policy Generator</Link>.
        </Paragraph>

        <Section>
          <SectionTitle>Interpretation and Definitions</SectionTitle>
          
          <SubSectionTitle>Interpretation</SubSectionTitle>
          <Paragraph>
            The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </Paragraph>
          
          <SubSectionTitle>Definitions</SubSectionTitle>
          <Paragraph>For the purposes of this Privacy Policy:</Paragraph>
          
          <UnorderedList>
            <ListItem>
              <Paragraph>
                <Strong>Account</Strong> means a unique account created for You to access our Service or parts of our Service.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Affiliate</Strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Company</Strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Unitalks.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Cookies</Strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Country</Strong> refers to: Delhi, India
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Device</Strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Personal Data</Strong> is any information that relates to an identified or identifiable individual.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Service</Strong> refers to the Website.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Service Provider</Strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Usage Data</Strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>Website</Strong> refers to Unitalks, accessible from <Link href="https://unitalks.in/" rel="external nofollow noopener" target="_blank">https://unitalks.in/</Link>
              </Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph>
                <Strong>You</Strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
              </Paragraph>
            </ListItem>
          </UnorderedList>
        </Section>

        <Section>
          <SectionTitle>Collecting and Using Your Personal Data</SectionTitle>
          
          <SubSectionTitle>Types of Data Collected</SubSectionTitle>
          
          <SubSubSectionTitle>Personal Data</SubSubSectionTitle>
          <Paragraph>
            While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
          </Paragraph>
          <UnorderedList>
            <ListItem>Usage Data</ListItem>
          </UnorderedList>
          
          <SubSubSectionTitle>Usage Data</SubSubSectionTitle>
          <Paragraph>Usage Data is collected automatically when using the Service.</Paragraph>
          <Paragraph>
            Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
          </Paragraph>
          <Paragraph>
            When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.
          </Paragraph>
          <Paragraph>
            We may also collect information that Your browser sends whenever You visit our Service or when You access the Service by or through a mobile device.
          </Paragraph>
          
          <SubSubSectionTitle>Tracking Technologies and Cookies</SubSubSectionTitle>
          <Paragraph>
            We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service. The technologies We use may include:
          </Paragraph>
          <UnorderedList>
            <ListItem>
              <Strong>Cookies or Browser Cookies.</Strong> A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service. Unless you have adjusted Your browser setting so that it will refuse Cookies, our Service may use Cookies.
            </ListItem>
            <ListItem>
              <Strong>Web Beacons.</Strong> Certain sections of our Service and our emails may contain small electronic files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit the Company, for example, to count users who have visited those pages or opened an email and for other related website statistics (for example, recording the popularity of a certain section and verifying system and server integrity).
            </ListItem>
          </UnorderedList>
          <Paragraph>
            Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on Your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close Your web browser. Learn more about cookies on the <Link href="https://www.freeprivacypolicy.com/blog/sample-privacy-policy-template/#Use_Of_Cookies_And_Tracking" target="_blank">Free Privacy Policy website</Link> article.
          </Paragraph>
          <Paragraph>We use both Session and Persistent Cookies for the purposes set out below:</Paragraph>
          <UnorderedList>
            <ListItem>
              <Paragraph><Strong>Necessary / Essential Cookies</Strong></Paragraph>
              <Paragraph>Type: Session Cookies</Paragraph>
              <Paragraph>Administered by: Us</Paragraph>
              <Paragraph>Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>Cookies Policy / Notice Acceptance Cookies</Strong></Paragraph>
              <Paragraph>Type: Persistent Cookies</Paragraph>
              <Paragraph>Administered by: Us</Paragraph>
              <Paragraph>Purpose: These Cookies identify if users have accepted the use of cookies on the Website.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>Functionality Cookies</Strong></Paragraph>
              <Paragraph>Type: Persistent Cookies</Paragraph>
              <Paragraph>Administered by: Us</Paragraph>
              <Paragraph>Purpose: These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.</Paragraph>
            </ListItem>
          </UnorderedList>
          <Paragraph>
            For more information about the cookies we use and your choices regarding cookies, please visit our Cookies Policy or the Cookies section of our Privacy Policy.
          </Paragraph>
          
          <SubSectionTitle>Use of Your Personal Data</SubSectionTitle>
          <Paragraph>The Company may use Personal Data for the following purposes:</Paragraph>
          <UnorderedList>
            <ListItem>
              <Paragraph><Strong>To provide and maintain our Service</Strong>, including to monitor the usage of our Service.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>To manage Your Account:</Strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>For the performance of a contract:</Strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>To contact You:</Strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>To provide You</Strong> with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>To manage Your requests:</Strong> To attend and manage Your requests to Us.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>For business transfers:</Strong> We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.</Paragraph>
            </ListItem>
            <ListItem>
              <Paragraph><Strong>For other purposes</Strong>: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</Paragraph>
            </ListItem>
          </UnorderedList>
          <Paragraph>We may share Your personal information in the following situations:</Paragraph>
          <UnorderedList>
            <ListItem><Strong>With Service Providers:</Strong> We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You.</ListItem>
            <ListItem><Strong>For business transfers:</Strong> We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.</ListItem>
            <ListItem><Strong>With Affiliates:</Strong> We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.</ListItem>
            <ListItem><Strong>With business partners:</Strong> We may share Your information with Our business partners to offer You certain products, services or promotions.</ListItem>
            <ListItem><Strong>With other users:</Strong> when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside.</ListItem>
            <ListItem><Strong>With Your consent</Strong>: We may disclose Your personal information for any other purpose with Your consent.</ListItem>
          </UnorderedList>
          
          <SubSectionTitle>Retention of Your Personal Data</SubSectionTitle>
          <Paragraph>
            The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
          </Paragraph>
          <Paragraph>
            The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.
          </Paragraph>
          
          <SubSectionTitle>Transfer of Your Personal Data</SubSectionTitle>
          <Paragraph>
            Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.
          </Paragraph>
          <Paragraph>
            Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.
          </Paragraph>
          <Paragraph>
            The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.
          </Paragraph>
          
          <SubSectionTitle>Delete Your Personal Data</SubSectionTitle>
          <Paragraph>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.</Paragraph>
          <Paragraph>Our Service may give You the ability to delete certain information about You from within the Service.</Paragraph>
          <Paragraph>
            You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us.
          </Paragraph>
          <Paragraph>
            Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.
          </Paragraph>
          
          <SubSectionTitle>Disclosure of Your Personal Data</SubSectionTitle>
          <SubSubSectionTitle>Business Transactions</SubSubSectionTitle>
          <Paragraph>
            If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.
          </Paragraph>
          <SubSubSectionTitle>Law enforcement</SubSubSectionTitle>
          <Paragraph>
            Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
          </Paragraph>
          <SubSubSectionTitle>Other legal requirements</SubSubSectionTitle>
          <Paragraph>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</Paragraph>
          <UnorderedList>
            <ListItem>Comply with a legal obligation</ListItem>
            <ListItem>Protect and defend the rights or property of the Company</ListItem>
            <ListItem>Prevent or investigate possible wrongdoing in connection with the Service</ListItem>
            <ListItem>Protect the personal safety of Users of the Service or the public</ListItem>
            <ListItem>Protect against legal liability</ListItem>
          </UnorderedList>
          
          <SubSectionTitle>Security of Your Personal Data</SubSectionTitle>
          <Paragraph>
            The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Children's Privacy</SectionTitle>
          <Paragraph>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.
          </Paragraph>
          <Paragraph>
            If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Links to Other Websites</SectionTitle>
          <Paragraph>
            Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.
          </Paragraph>
          <Paragraph>
            We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Changes to this Privacy Policy</SectionTitle>
          <Paragraph>
            We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
          </Paragraph>
          <Paragraph>
            We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.
          </Paragraph>
          <Paragraph>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Contact Us</SectionTitle>
          <Paragraph>If you have any questions about this Privacy Policy, You can contact us:</Paragraph>
          <ContactList>
            <ContactItem>By email: <Link href="mailto:help@unitalks.com">help@unitalks.com</Link></ContactItem>
          </ContactList>
        </Section>
      </PrivacyContent>
      
      <Footer />
    </PrivacyContainer>
  );
}

export default Privacy;
